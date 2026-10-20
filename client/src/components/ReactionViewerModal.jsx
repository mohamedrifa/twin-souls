import React, { useState, useEffect } from 'react';
import { X, Play, Download, Video, Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':5000');

export default function ReactionViewerModal({ isOpen, onClose, token }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !token) return;

    const fetchRecordings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/recordings/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecordings(data.recordings || []);
          if (data.recordings?.length > 0) {
            setActiveVideo(data.recordings[0].fileKey);
          }
        } else {
          setError('Could not retrieve recordings from private vault');
        }
      } catch (err) {
        setError('Network error loading recordings');
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-maroon-950 border border-gold/40 shadow-gold-glow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gold/20 bg-maroon-900/60">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-gold" />
            <h3 className="font-regal text-sm font-bold text-ivory">Birthday Reaction Vault</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-roseGray hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <p className="text-xs text-roseGray">Loading reaction videos from vault...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          ) : recordings.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm text-ivory font-medium">No reaction recordings found yet</p>
              <p className="text-xs text-roseGray">
                Recordings are captured only when camera consent is enabled during the surprise.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Player */}
              {activeVideo && (
                <div className="w-full rounded-xl overflow-hidden border border-gold/30 bg-black aspect-video relative shadow-maroon-deep">
                  <video
                    key={activeVideo}
                    controls
                    playsInline
                    autoPlay
                    src={`${API_URL}/api/recordings/stream/${activeVideo}?token=${token}`}
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Video List */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-roseGray font-semibold">
                  Saved Reactions
                </p>
                {recordings.map((rec, index) => {
                  const isSelected = activeVideo === rec.fileKey;
                  const isKow = rec.participant === 'kowsalya' || rec.participant === 'kausalya';
                  const sisterName = isKow ? 'Kausalya' : 'Kaushika';

                  return (
                    <div
                      key={rec.fileKey || index}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? 'bg-maroon-900 border-gold shadow-gold-glow'
                          : 'bg-maroon-950/60 border-gold/20 hover:border-gold/40'
                      }`}
                    >
                      <button
                        onClick={() => setActiveVideo(rec.fileKey)}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center text-gold shrink-0">
                          <Play className="w-4 h-4 fill-gold text-gold ml-0.5" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-ivory block truncate">
                            {sisterName}'s Reaction
                          </span>
                          <span className="text-[10px] text-roseGray block">
                            {rec.hasMp4 ? 'Universal MP4 format' : 'Recorded web format'} &bull; {Math.round(rec.totalBytes / 1024)} KB
                          </span>
                        </div>
                      </button>

                      {/* Download Button */}
                      <a
                        href={`${API_URL}/api/recordings/download/${rec.fileKey}?token=${token}`}
                        download
                        className="p-2 rounded-lg bg-gold/10 hover:bg-gold/25 border border-gold/30 text-gold-light hover:text-white transition-colors"
                        title="Download MP4 video to your device"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gold/20 bg-maroon-900/60 text-center">
          <p className="text-[10px] text-roseGray">
            🔒 Private family memory vault &bull; Encoded in universal H.264 MP4
          </p>
        </div>
      </div>
    </div>
  );
}
