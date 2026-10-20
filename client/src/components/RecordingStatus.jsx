import React, { useState } from 'react';
import { Video, Square, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function RecordingStatus({
  isRecording,
  recorderStatus,
  uploadedChunks,
  previewStream,
  onStopRecording,
  errorMessage
}) {
  const [showPreview, setShowPreview] = useState(false);

  if (recorderStatus === 'idle' || recorderStatus === 'denied') {
    return null;
  }

  return (
    <div className="fixed top-3 inset-x-0 mx-auto w-[92%] max-w-sm z-50 transition-all select-none">
      <div className="rounded-2xl bg-maroon-950/90 border border-gold/40 backdrop-blur-md px-3.5 py-2.5 shadow-gold-glow flex items-center justify-between gap-2.5">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          {isRecording ? (
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </div>
          ) : recorderStatus === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          )}

          <div className="truncate">
            <span className="text-xs font-semibold text-ivory block truncate">
              {isRecording
                ? 'Recording Reaction'
                : recorderStatus === 'uploading'
                ? 'Saving Memory Chunks...'
                : recorderStatus === 'completed'
                ? 'Memory Saved Safely ❤️'
                : 'Camera Ready'}
            </span>
            <span className="text-[10px] text-roseGray block truncate">
              {isRecording
                ? `${uploadedChunks} chunk${uploadedChunks === 1 ? '' : 's'} secured in private vault`
                : recorderStatus === 'completed'
                ? 'Private family vault'
                : 'Protected reaction capture'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Toggle Tiny Preview */}
          {previewStream && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1.5 rounded-lg bg-maroon-900 border border-gold/20 text-gold-light hover:text-white"
              title={showPreview ? 'Hide camera preview' : 'View camera preview'}
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Stop Button */}
          {isRecording && (
            <button
              onClick={onStopRecording}
              className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-1 hover:bg-red-900 active:scale-95"
            >
              <Square className="w-3 h-3 fill-red-400 text-red-400" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating mini preview if enabled */}
      {showPreview && previewStream && (
        <div className="mt-2 mx-auto w-24 h-32 rounded-xl overflow-hidden border-2 border-gold shadow-gold-glow bg-black">
          <video
            ref={(videoEl) => {
              if (videoEl && videoEl.srcObject !== previewStream) {
                videoEl.srcObject = previewStream;
              }
            }}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        </div>
      )}

      {errorMessage && (
        <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-[10px] text-amber-200 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
