import React, { useState, useEffect } from 'react';
import { useCelebrationSocket } from './hooks/useCelebrationSocket';
import { useRecorder } from './hooks/useRecorder';
import Invitation from './components/Invitation';
import RecordingConsent from './components/RecordingConsent';
import AccessCode from './components/AccessCode';
import WaitingRoom from './components/WaitingRoom';
import Countdown from './components/Countdown';
import GiftReveal from './components/GiftReveal';
import RecordingStatus from './components/RecordingStatus';
import ReactionViewerModal from './components/ReactionViewerModal';
import { RotateCcw, Video, X } from 'lucide-react';

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

  // Screen flow: 'invitation' | 'consent' | 'access' | 'waiting' | 'countdown' | 'reveal'
  const [currentScreen, setCurrentScreen] = useState('invitation');
  const [hasConsentToRecord, setHasConsentToRecord] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);

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

  // When session is restarted by server (e.g. sister refreshed screen), return to invitation
  useEffect(() => {
    if (restartNotice) {
      setCurrentScreen('invitation');
      if (isRecording) {
        stopRecording();
      }
    }
  }, [restartNotice, isRecording, stopRecording]);

  // Synchronize screen state with server sessionState and token
  useEffect(() => {
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
  }, [sessionState, participant, countdownEndsAt, gifts]);

  // 1. Invitation CTA -> Consent screen
  const handleStartInvitation = () => {
    setCurrentScreen('consent');
  };

  // 2. Consent granted -> start recording & proceed to access code
  const handleConsentGranted = async () => {
    setHasConsentToRecord(true);
    await startRecording();
    setCurrentScreen('access');
  };

  // 3. Consent declined -> proceed to access code without recording
  const handleConsentDeclined = () => {
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

  // 6. Finish recording from reveal screen
  const handleFinishRecording = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <div className="min-h-screen bg-maroon-950 text-ivory flex flex-col justify-between relative selection:bg-gold/30">
      {/* Recording Status Bar (Non-intrusive floating indicator) */}
      <RecordingStatus
        isRecording={isRecording}
        recorderStatus={recorderStatus}
        uploadedChunks={uploadedChunks}
        previewStream={previewStream}
        onStopRecording={stopRecording}
        errorMessage={recorderError}
      />

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
            gifts={gifts}
            participant={participant}
            onFinishRecording={isRecording ? handleFinishRecording : null}
            onOpenReactions={() => setShowReactionsModal(true)}
          />
        )}
      </main>

      {/* Reaction Video Player & Download Modal */}
      <ReactionViewerModal
        isOpen={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
        token={token}
      />

      {/* Organizer / Rehearsal Reset Control (Discrete bottom button) */}
      <footer className="w-full py-2.5 px-4 flex items-center justify-between text-[11px] text-roseGray/60 select-none">
        <span>Two Souls. One Celebration &bull; 2026</span>
        <div className="flex items-center gap-3">
          {token && (
            <button
              onClick={() => setShowReactionsModal(true)}
              className="hover:text-gold-light active:text-gold flex items-center gap-1 transition-colors p-1"
              title="View recorded reactions"
            >
              <Video className="w-3 h-3 text-gold" />
              <span>Reactions</span>
            </button>
          )}
          <button
            onClick={resetSession}
            className="hover:text-gold-light active:text-gold flex items-center gap-1 transition-colors p-1"
            title="Reset session for rehearsal testing"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Rehearse / Reset</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
