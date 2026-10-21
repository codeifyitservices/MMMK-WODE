import { useEffect, useState } from 'react';
import { getOrCreateVisitorSessionId } from '../utils/visitorSession';

const STORAGE_KEY = 'mmmk_influencer_ref';
const TIMESTAMP_KEY = 'mmmk_influencer_ref_time';
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days attribution

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Helper to get currently active referral code from localStorage
 */
export const getActiveInfluencerRef = () => {
  if (typeof window === 'undefined') return null;

  try {
    const code = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);

    if (!code) return null;

    if (timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age > ATTRIBUTION_WINDOW_MS) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TIMESTAMP_KEY);
        return null;
      }
    }

    return code.trim().toUpperCase();
  } catch {
    return null;
  }
};

/**
 * Helper to manually set referral code in localStorage
 */
export const setActiveInfluencerRef = (code) => {
  if (typeof window === 'undefined' || !code) return;
  try {
    const normalized = String(code).trim().toUpperCase();
    localStorage.setItem(STORAGE_KEY, normalized);
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
    window.dispatchEvent(
      new CustomEvent('mmmk_influencer_changed', { detail: { code: normalized } })
    );
  } catch {}
};

/**
 * Helper to clear influencer code
 */
export const clearActiveInfluencerRef = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
    window.dispatchEvent(
      new CustomEvent('mmmk_influencer_changed', { detail: { code: null } })
    );
  } catch {}
};

/**
 * Hook to automatically track clicks and provide active referral discount state
 */
export default function useInfluencerTracking() {
  const [activeCode, setActiveCode] = useState(getActiveInfluencerRef());
  const [influencerInfo, setInfluencerInfo] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Intercept URL Search Params (?ref=CODE or ?ref-CODE or ?influencer=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    let paramCode = urlParams.get('ref') || urlParams.get('influencer');

    if (!paramCode && window.location.search) {
      const match = window.location.search.match(/[?&](?:ref|influencer)[=-]([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        paramCode = match[1];
      }
    }

    if (paramCode) {
      const cleanCode = paramCode.trim().toUpperCase();
      setActiveInfluencerRef(cleanCode);
      setActiveCode(cleanCode);

      // Log click beacon to backend
      const visitorSessionId = getOrCreateVisitorSessionId();
      fetch(`${BACKEND_URL}/api/v1/influencer/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: cleanCode,
          landingUrl: window.location.href,
          visitorSessionId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.data) {
            setInfluencerInfo(data.data);
          }
        })
        .catch(() => {});
    }

    // 2. Listen for storage changes across tabs / components
    const handleRefChange = (event) => {
      setActiveCode(event?.detail?.code || getActiveInfluencerRef());
    };

    window.addEventListener('mmmk_influencer_changed', handleRefChange);
    return () => {
      window.removeEventListener('mmmk_influencer_changed', handleRefChange);
    };
  }, []);

  return {
    activeReferralCode: activeCode,
    discountRate: 20,
    hasActiveDiscount: !!activeCode,
    influencerInfo,
    clearReferral: clearActiveInfluencerRef,
  };
}
