export function parseJWT(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenValid(payload) {
  if (!payload) return false;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return false;
  // Allow 60 seconds of clock skew tolerance
  if (payload.iat && payload.iat > now + 60) return false;
  return true;
}
