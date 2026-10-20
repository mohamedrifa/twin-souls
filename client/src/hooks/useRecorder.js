import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':5000');

// Pick best supported video mime type (prefer MP4 / H.264 for universal compatibility)
function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=h264,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}

export function useRecorder({ token, onChunkUploaded, onFinalized }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorderStatus, setRecorderStatus] = useState('idle'); // idle | initializing | recording | uploading | completed | error | denied
  const [errorMessage, setErrorMessage] = useState(null);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [previewStream, setPreviewStream] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunkQueueRef = useRef([]);
  const isUploadingRef = useRef(false);
  const tokenRef = useRef(token);
  const mimeTypeRef = useRef('video/webm');

  // When token becomes available, resume uploading queued chunks without losing the initial header chunk
  useEffect(() => {
    tokenRef.current = token;
    if (token && chunkQueueRef.current.length > 0) {
      processQueue();
    }
  }, [token]);

  // Upload single chunk with retry
  const uploadChunk = async (chunkBlob, retries = 3) => {
    if (!tokenRef.current) {
      // Token not available yet - retain chunk in queue for later!
      return false;
    }

    const currentMime = mimeTypeRef.current;
    const isMp4 = currentMime.toLowerCase().includes('mp4');
    const filename = isMp4 ? 'chunk.mp4' : 'chunk.webm';

    const formData = new FormData();
    // Append text fields first so multipart parsers receive mimeType before file stream
    formData.append('mimeType', currentMime);
    formData.append('chunk', chunkBlob, filename);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${API_URL}/api/recordings/chunk`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setUploadedChunks(prev => prev + 1);
          if (onChunkUploaded) onChunkUploaded(data);
          return true;
        }
      } catch (err) {
        console.warn(`Chunk upload attempt ${attempt} failed:`, err);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    return false;
  };

  // Process chunk queue sequentially
  const processQueue = async () => {
    if (isUploadingRef.current || chunkQueueRef.current.length === 0) return;
    
    // If token is not ready yet, wait until token arrives
    if (!tokenRef.current) {
      return;
    }

    isUploadingRef.current = true;

    while (chunkQueueRef.current.length > 0 && tokenRef.current) {
      const chunkBlob = chunkQueueRef.current[0]; // Peek first chunk
      if (chunkBlob && chunkBlob.size > 0) {
        const success = await uploadChunk(chunkBlob);
        if (success) {
          chunkQueueRef.current.shift(); // Only remove after successful upload!
        } else {
          // If upload failed even after retries, pause queue to avoid dropping chunks
          break;
        }
      } else {
        chunkQueueRef.current.shift();
      }
    }

    isUploadingRef.current = false;
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      setRecorderStatus('initializing');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser.');
      }

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('Video recording formats are not supported on this device.');
      }
      mimeTypeRef.current = mimeType;

      // Request camera and microphone
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24, max: 30 }
          },
          audio: true
        });
      } catch (audioErr) {
        console.warn('Audio + video failed, attempting video-only:', audioErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
      }

      streamRef.current = stream;
      setPreviewStream(stream);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 600000 // 600kbps efficient profile
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          // Push chunk to queue
          chunkQueueRef.current.push(event.data);
          processQueue();
        }
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setRecorderStatus('error');
        setErrorMessage('Recording encountered a technical glitch.');
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        // Wait for all queued chunks to finish uploading
        await processQueue();
        // Wait an extra moment to ensure server has finished appending
        await new Promise(r => setTimeout(r, 600));
        // Finalize recording (transcodes to universal MP4 on server)
        await finalize();
      };

      // Record in 4-second segments for smooth low-risk chunking
      recorder.start(4000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecorderStatus('recording');
      return true;
    } catch (err) {
      console.warn('Camera access denied or failed:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setRecorderStatus(isDenied ? 'denied' : 'error');
      setErrorMessage(isDenied ? 'Camera permission was denied. Continuing celebration without recording.' : err.message);
      setIsRecording(false);
      return false;
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // Request any pending data before stopping
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping mediaRecorder:', e);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setPreviewStream(null);
    }

    setIsRecording(false);
  }, []);

  // Finalize upload on backend
  const finalize = async () => {
    if (!tokenRef.current) return;
    setRecorderStatus('uploading');

    try {
      const res = await fetch(`${API_URL}/api/recordings/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenRef.current}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRecorderStatus('completed');
        if (onFinalized) onFinalized(data);
      } else {
        setRecorderStatus('completed');
      }
    } catch (e) {
      console.warn('Finalize call failed:', e);
      setRecorderStatus('completed');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return {
    isRecording,
    recorderStatus,
    errorMessage,
    uploadedChunks,
    previewStream,
    startRecording,
    stopRecording
  };
}
