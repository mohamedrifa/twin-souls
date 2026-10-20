import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin.replace(':5173', ':5000');
const SESSION_ID = import.meta.env.VITE_SESSION_ID || 'birthday-2026';

export function useCelebrationSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessionState, setSessionState] = useState(null);
  
  // Ephemeral in-memory state: NO sessionStorage or persistent tokens
  // If the screen refreshes, all credentials and state are discarded!
  const [participant, setParticipant] = useState(null);
  const [token, setToken] = useState(null);
  const [waitingSister, setWaitingSister] = useState(null);
  const [countdownEndsAt, setCountdownEndsAt] = useState(null);
  const [gifts, setGifts] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [restartNotice, setRestartNotice] = useState(null);

  const socketRef = useRef(null);

  // Clear any legacy storage on startup
  useEffect(() => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('twin_participant_token');
      localStorage.removeItem('twin_participant_profile');
    } catch (e) {}
  }, []);

  // Initialize Socket connection
  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      auth: {
        sessionId: SESSION_ID
      }
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      console.log('Socket connected:', s.id);
      setConnected(true);
      setAuthError(null);
    });

    s.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    s.on('join_success', (data) => {
      console.log('Join success received:', data);
      const profile = {
        participant: data.participant,
        displayName: data.displayName,
        academy: data.academy,
        twinName: data.twinName
      };
      setParticipant(profile);
      setWaitingSister(data.twinName);
      if (data.token) {
        setToken(data.token);
      }

      if (data.sessionState) {
        processSessionState(data.sessionState);
      }
    });

    s.on('waiting_for_twin', (data) => {
      console.log('Waiting for sister:', data);
      setWaitingSister(data.sisterName);
    });

    s.on('both_ready', (data) => {
      console.log('Both ready event! Countdown deadline:', data);
      if (data.serverTime) {
        setClockOffset(data.serverTime - Date.now());
      }
      setCountdownEndsAt(data.countdownEndsAt);
      setSessionState(prev => ({
        ...(prev || {}),
        bothJoined: true,
        status: 'COUNTDOWN',
        countdownEndsAt: data.countdownEndsAt
      }));
    });

    s.on('session_state', (state) => {
      console.log('Session state update received:', state);
      processSessionState(state);
    });

    // Session restarted broadcast from server because one sister refreshed or disconnected
    s.on('session_restarted', (data) => {
      console.log('Session restarted for both participants:', data);
      // Reset all in-memory state back to start
      setParticipant(null);
      setToken(null);
      setSessionState(null);
      setCountdownEndsAt(null);
      setGifts(null);
      setWaitingSister(null);
      setRestartNotice(data?.message || 'Screen was refreshed. Celebration has restarted for both of you!');
    });

    s.on('gift_revealed', (data) => {
      console.log('Gift revealed event:', data);
      if (data.gifts) {
        setGifts(data.gifts);
      }
    });

    s.on('auth_error', (data) => {
      setAuthError(data?.message || 'Access error');
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const processSessionState = useCallback((state) => {
    if (!state) return;
    setSessionState(state);

    if (state.serverTime) {
      setClockOffset(state.serverTime - Date.now());
    }

    if (state.countdownEndsAt) {
      setCountdownEndsAt(state.countdownEndsAt);
    }

    if (state.status === 'REVEALED' && state.gifts) {
      setGifts(state.gifts);
    }
  }, []);

  // Join celebration with code
  const joinCelebration = useCallback((code, consentToRecord = false) => {
    setAuthError(null);
    setRestartNotice(null);
    if (!socketRef.current) return Promise.reject(new Error('Socket not ready'));

    return new Promise((resolve, reject) => {
      socketRef.current.emit(
        'join_celebration',
        {
          code: code.trim(),
          sessionId: SESSION_ID,
          consentToRecord
        },
        (response) => {
          if (response && response.success) {
            resolve(response);
          } else {
            const msg = response?.message || 'Invalid access code';
            setAuthError(msg);
            reject(new Error(msg));
          }
        }
      );
    });
  }, []);

  // Notify server client countdown reached zero
  const notifyCountdownComplete = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('countdown_complete');
    }
  }, []);

  // Broadcast recording status
  const sendRecordingStatus = useCallback((isRecording) => {
    if (socketRef.current) {
      socketRef.current.emit('recording_status', { isRecording });
    }
  }, []);

  // Reset session (for testing/rehearsal)
  const resetSession = useCallback(async () => {
    const API_URL = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':5000');
    setParticipant(null);
    setToken(null);
    setCountdownEndsAt(null);
    setGifts(null);
    setSessionState(null);

    try {
      await fetch(`${API_URL}/api/celebration/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: SESSION_ID })
      });
      window.location.reload();
    } catch (err) {
      console.error('Error resetting session:', err);
    }
  }, []);

  return {
    socket,
    connected,
    sessionState,
    participant,
    token,
    waitingSister,
    countdownEndsAt,
    gifts,
    authError,
    clockOffset,
    restartNotice,
    clearRestartNotice: () => setRestartNotice(null),
    joinCelebration,
    notifyCountdownComplete,
    sendRecordingStatus,
    resetSession,
    clearAuthError: () => setAuthError(null)
  };
}
