import axios from 'axios';
import { getOrCreateVisitorSessionId } from './visitorSession';
import API_URL from './api';

const SESSION_TRACKED_KEY = 'mmk_traffic_tracked';

export const trackVisitorTraffic = async (currentPath) => {
  if (typeof window === 'undefined') return;

  try {
    const path = currentPath || window.location.pathname || '/';

    // Do not track when viewing admin pages
    if (path.startsWith('/admin')) {
      return;
    }

    // Only track once per browser session
    if (sessionStorage.getItem(SESSION_TRACKED_KEY) === 'true') {
      return;
    }

    const sessionId = getOrCreateVisitorSessionId();
    const referrer = document.referrer || '';
    const landingPage = path;

    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get('utm_source') || '';
    const utm_medium = urlParams.get('utm_medium') || '';
    const utm_campaign = urlParams.get('utm_campaign') || '';

    const backendUrl = API_URL || import.meta.env.VITE_BACKEND_URL || '';
    const targetUrl = `${backendUrl.replace(/\/$/, '')}/api/v1/traffic-record`;

    const response = await axios.post(
      targetUrl,
      {
        sessionId,
        referrer,
        landingPage,
        utm_source,
        utm_medium,
        utm_campaign,
      },
      { timeout: 5000 }
    );

    // Only mark session as tracked after the backend request succeeds
    if (response?.data?.success) {
      sessionStorage.setItem(SESSION_TRACKED_KEY, 'true');
    }
  } catch (err) {
    // Silently ignore tracking errors to avoid interfering with user experience
  }
};
