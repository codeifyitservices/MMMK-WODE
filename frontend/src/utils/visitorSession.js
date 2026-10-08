const VISITOR_SESSION_KEY = 'mmk_visitor_session_id';

export const getOrCreateVisitorSessionId = () => {
  try {
    let sessionId = localStorage.getItem(VISITOR_SESSION_KEY);
    if (!sessionId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        sessionId = crypto.randomUUID();
      } else {
        sessionId = `vs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      }
      localStorage.setItem(VISITOR_SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch (err) {
    return `vs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
};
