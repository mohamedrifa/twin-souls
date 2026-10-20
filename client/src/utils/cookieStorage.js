// Cookie and persistent storage helpers for permanent birthday reveal

const COOKIE_NAME = 'twin_celebration_revealed';
const STORAGE_KEY = 'twin_celebration_revealed_state';

/**
 * Save revealed birthday state to cookie and localStorage
 * Once revealed, sisters can reopen the link anytime and directly view their gift.
 */
export function saveRevealedState({ participant, gifts, token }) {
  if (!participant || !gifts) return;

  try {
    const payload = {
      participant,
      gifts,
      token: token || null,
      savedAt: Date.now()
    };
    const jsonStr = JSON.stringify(payload);

    // 1. Set cookie for 1 year (365 days)
    const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(jsonStr)}; max-age=${maxAge}; path=/; SameSite=Lax`;

    // 2. Also persist in localStorage for maximum mobile browser resilience
    localStorage.setItem(STORAGE_KEY, jsonStr);
    console.log('🎉 Birthday reveal state permanently saved to cookies and storage for', participant.displayName || participant.participant);
  } catch (err) {
    console.warn('Failed to save revealed state to storage:', err);
  }
}

/**
 * Retrieve saved revealed state from cookie or localStorage
 */
export function getRevealedState() {
  // Check cookie
  try {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
    if (match && match[1]) {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (parsed && parsed.participant && parsed.gifts) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading reveal cookie:', e);
  }

  // Check localStorage backup
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed && parsed.participant && parsed.gifts) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading reveal localStorage:', e);
  }

  return null;
}

/**
 * Clear saved reveal state (used by Rehearse / Reset button)
 */
export function clearRevealedState() {
  try {
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
    localStorage.removeItem(STORAGE_KEY);
    console.log('🔄 Revealed cookie and storage cleared.');
  } catch (e) {
    console.warn('Error clearing revealed state:', e);
  }
}
