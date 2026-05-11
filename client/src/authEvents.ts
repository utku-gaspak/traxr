// React state will not notice localStorage-only auth changes made outside component code,
// so API clients use this event to invalidate auth on the current tab immediately.
export const AUTH_TOKEN_CLEARED_EVENT = "auth:token-cleared";

export const notifyAuthTokenCleared = () => {
  window.dispatchEvent(new Event(AUTH_TOKEN_CLEARED_EVENT));
};
