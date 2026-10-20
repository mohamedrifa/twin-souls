import React, { useState, useEffect, useRef } from 'react';
import { useCelebrationSocket } from './hooks/useCelebrationSocket';
import { useRecorder } from './hooks/useRecorder';
import { saveRevealedState, getRevealedState, clearRevealedState } from './utils/cookieStorage';
import Invitation from './components/Invitation';
import RecordingConsent from './components/RecordingConsent';
import AccessCode from './components/AccessCode';
import WaitingRoom from './components/WaitingRoom';
import Countdown from './components/Countdown';
import GiftReveal from './components/GiftReveal';
import { RotateCcw, X } from 'lucide-react';

export default function App() {
  const {
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
    clearRestartNotice,
    joinCelebration,
    notifyCountdownComplete,
    sendRecordingStatus,
    resetSession,
    clearAuthError
  } = useCelebrationSocket();

  // Check if this device already unlocked and experienced the reveal
  const savedRevealed = getRevealedState();

  // Screen flow: 'invitation' | 'consent' | 'access' | 'waiting' | 'countdown' | 'reveal'
  const [currentScreen, setCurrentScreen] = useState(savedRevealed ? 'reveal' : 'invitation');
  const [persistedParticipant, setPersistedParticipant] = useState(savedRevealed?.participant || null);
  const [persistedGifts, setPersistedGifts] = useState(savedRevealed?.gifts || null);
  const [hasConsentToRecord, setHasConsentToRecord] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [downloadTimerStarted, setDownloadTimerStarted] = useState(false);

  // Effective participant and gifts (prioritizing live session, falling back to saved cookie)
  const activeParticipant = participant || persistedParticipant;
  const activeGifts = gifts || persistedGifts;

  // Reaction Recorder Hook
  const {
    isRecording,
    recorderStatus,
    errorMessage: recorderError,
    uploadedChunks,
    previewStream,
    startRecording,
    stopRecording
  } = useRecorder({
    token,
    onChunkUploaded: (chunkData) => {
      // Sync chunk progress
    },
    onFinalized: () => {
      sendRecordingStatus(false);
    }
  });

  // Keep socket updated with recording status
  useEffect(() => {
    sendRecordingStatus(isRecording);
  }, [isRecording, sendRecordingStatus]);

  // Permanently store reveal state in cookies & storage whenever reveal page is reached
  useEffect(() => {
    if (currentScreen === 'reveal' && activeParticipant && activeGifts) {
      saveRevealedState({
        participant: activeParticipant,
        gifts: activeGifts,
        token: token || savedRevealed?.token
      });
    }
  }, [currentScreen, activeParticipant, activeGifts, token, savedRevealed?.token]);

  // When session is restarted by server (e.g. sister refreshed screen), return to invitation UNLESS already permanently revealed
  useEffect(() => {
    if (restartNotice) {
      // If already on the permanent reveal page, preserve it and do not send back to invitation
      if (currentScreen === 'reveal' || getRevealedState()) {
        console.log('Sister has already unlocked surprise page. Preserving reveal.');
        return;
      }
      setCurrentScreen('invitation');
      stopRecording();
    }
  }, [restartNotice, currentScreen]);

  // Synchronize screen state with server sessionState and token
  useEffect(() => {
    // If this device is already on the permanent reveal screen, stay there
    if (currentScreen === 'reveal' && activeGifts) {
      return;
    }

    // If not authenticated with code yet, preserve current landing/entry screens
    if (!participant) {
      return;
    }

    // 1. If countdown deadline is set and active -> SHOW COUNTDOWN!
    if (countdownEndsAt && countdownEndsAt > Date.now()) {
      setCurrentScreen('countdown');
      return;
    }

    // 2. If countdown has completed and status is REVEALED -> SHOW REVEAL!
    if (sessionState?.bothJoined && sessionState?.status === 'REVEALED' && (gifts || sessionState?.gifts)) {
      setCurrentScreen('reveal');
      return;
    }

    // 3. If session status is COUNTDOWN
    if (sessionState?.status === 'COUNTDOWN') {
      setCurrentScreen('countdown');
      return;
    }

    // 4. If only one sister has joined -> STRICTLY STAY IN WAITING ROOM!
    if (!sessionState?.bothJoined) {
      setCurrentScreen('waiting');
      return;
    }

    // Fallback to waiting if not yet counting down
    setCurrentScreen('waiting');
  }, [sessionState, participant, countdownEndsAt, gifts, currentScreen, activeGifts]);

  // 1. Invitation CTA -> Consent screen
  const handleStartInvitation = () => {
    if (clearRestartNotice) clearRestartNotice();
    setCurrentScreen('consent');
  };

  // 2. Consent granted -> start recording & proceed to access code
  const handleConsentGranted = async () => {
    if (clearRestartNotice) clearRestartNotice();
    setHasConsentToRecord(true);
    await startRecording();
    setCurrentScreen('access');
  };

  // 3. Consent declined -> proceed to access code without recording
  const handleConsentDeclined = () => {
    if (clearRestartNotice) clearRestartNotice();
    setHasConsentToRecord(false);
    setCurrentScreen('access');
  };

  // 4. Access Code Submit
  const handleCodeSubmit = async (code) => {
    setIsSubmittingCode(true);
    try {
      const response = await joinCelebration(code, hasConsentToRecord);
      // If the other sister is NOT joined yet, ALWAYS go to waiting screen
      if (!response?.sessionState?.bothJoined) {
        setCurrentScreen('waiting');
      } else if (response.sessionState.status === 'COUNTDOWN') {
        setCurrentScreen('countdown');
      } else if (response.sessionState.status === 'REVEALED') {
        setCurrentScreen('reveal');
      } else {
        setCurrentScreen('waiting');
      }
    } catch (err) {
      console.error('Failed to submit access code:', err);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // 5. Shared Countdown complete -> transition to reveal
  const handleCountdownComplete = () => {
    notifyCountdownComplete();
    setCurrentScreen('reveal');
  };

  // Dual-timer references for stopping reaction recording
  const pageTimerRef = useRef(null);
  const downloadTimerRef = useRef(null);
  const hasFinishedRecordingRef = useRef(false);

  // Helper to cleanly stop recording once
  const triggerStopRecording = (reason) => {
    if (hasFinishedRecordingRef.current) return;
    hasFinishedRecordingRef.current = true;
    console.log(`🎬 Stopping and finalizing reaction recording: ${reason}`);

    if (pageTimerRef.current) clearTimeout(pageTimerRef.current);
    if (downloadTimerRef.current) clearTimeout(downloadTimerRef.current);

    stopRecording();
  };

  // Trigger 1: Auto-stop 30 seconds after Surprise Unveiled page appears
  useEffect(() => {
    if (currentScreen === 'reveal' && isRecording && !hasFinishedRecordingRef.current) {
      console.log('Surprise Unveiled page reached. 30-second auto-stop timer started...');
      pageTimerRef.current = setTimeout(() => {
        triggerStopRecording('30 seconds elapsed on Surprise page');
      }, 30000);

      return () => {
        if (pageTimerRef.current) {
          clearTimeout(pageTimerRef.current);
        }
      };
    }
  }, [currentScreen, isRecording]);

  // Trigger 2: 10 seconds after clicking "Unlock & Download App" button (or 30s timer, whichever is first)
  const handleAppDownloadClicked = () => {
    if (downloadTimerStarted || hasFinishedRecordingRef.current || !isRecording) return;
    setDownloadTimerStarted(true);
    console.log('App download clicked. Scheduling stop in 10 seconds (or when 30s page limit expires)...');

    downloadTimerRef.current = setTimeout(() => {
      triggerStopRecording('10 seconds elapsed after app download click');
    }, 10000);
  };

  // 7. Full Rehearsal / Organizer Reset
  const handleRehearseReset = async () => {
    hasFinishedRecordingRef.current = false;
    if (pageTimerRef.current) clearTimeout(pageTimerRef.current);
    if (downloadTimerRef.current) clearTimeout(downloadTimerRef.current);
    clearRevealedState();
    setPersistedParticipant(null);
    setPersistedGifts(null);
    setCurrentScreen('invitation');
    await resetSession();
  };

  return (
    <div className="min-h-screen bg-maroon-950 text-ivory flex flex-col justify-between relative selection:bg-gold/30">
      {/* Invisible video element to keep mobile camera hardware pipeline actively streaming without any UI indicator */}
      {previewStream && (
        <video
          ref={(el) => {
            if (el && el.srcObject !== previewStream) {
              el.srcObject = previewStream;
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          muted
          aria-hidden="true"
          className="sr-only fixed -top-96 -left-96 w-1 h-1 pointer-events-none opacity-0"
        />
      )}

      {/* Restart Notice Banner when session restarts due to screen refresh */}
      {restartNotice && (
        <div className="fixed top-3 inset-x-0 mx-auto w-[92%] max-w-sm z-50 transition-all select-none animate-fadeIn">
          <div className="rounded-2xl bg-amber-950/95 border border-amber-500/60 backdrop-blur-md px-3.5 py-2.5 shadow-gold-glow flex items-center justify-between gap-2.5 text-amber-100">
            <div className="flex items-center gap-2 min-w-0">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 animate-spin-slow" />
              <div className="truncate">
                <span className="text-xs font-bold block text-amber-200">Session Restarted</span>
                <span className="text-[11px] text-amber-100/90 block leading-tight">{restartNotice}</span>
              </div>
            </div>
            <button
              onClick={clearRestartNotice}
              className="p-1 rounded-lg text-amber-300 hover:text-white hover:bg-amber-900/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen Router */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {currentScreen === 'invitation' && (
          <Invitation onStart={handleStartInvitation} />
        )}

        {currentScreen === 'consent' && (
          <RecordingConsent
            onConsentGranted={handleConsentGranted}
            onConsentDeclined={handleConsentDeclined}
          />
        )}

        {currentScreen === 'access' && (
          <AccessCode
            onSubmitCode={handleCodeSubmit}
            isSubmitting={isSubmittingCode}
            error={authError}
            clearError={clearAuthError}
          />
        )}

        {currentScreen === 'waiting' && (
          <WaitingRoom
            participant={participant}
            waitingSister={waitingSister}
            connected={connected}
          />
        )}

        {currentScreen === 'countdown' && (
          <Countdown
            countdownEndsAt={countdownEndsAt}
            clockOffset={clockOffset}
            onComplete={handleCountdownComplete}
          />
        )}

        {currentScreen === 'reveal' && (
          <GiftReveal
            gifts={activeGifts}
            participant={activeParticipant}
            onAppDownloadClicked={handleAppDownloadClicked}
          />
        )}
      </main>

      {/* Organizer / Rehearsal Reset Control (Discrete bottom button) */}
      <footer className="w-full py-2.5 px-4 flex items-center justify-between text-[11px] text-roseGray/60 select-none">
        <span>Two Souls. One Celebration &bull; 2026</span>
        <button
          onClick={handleRehearseReset}
          className="hover:text-gold-light active:text-gold flex items-center gap-1 transition-colors p-1"
          title="Reset session for rehearsal testing"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Rehearse / Reset</span>
        </button>
      </footer>
    </div>
  );
}
