export const AUTH_COOKIE = "innosight_gate";

export async function hashSecret(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getSitePassword() {
  return process.env.SITE_PASSWORD?.trim() ?? "";
}

export async function createAuthToken() {
  const password = getSitePassword();
  if (!password) return "";
  return hashSecret(password);
}

export async function verifySitePassword(input: string) {
  const expected = getSitePassword();
  if (!expected) return false;
  const left = await hashSecret(input);
  const right = await hashSecret(expected);
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function isValidAuthToken(token: string | undefined) {
  if (!token) return false;
  const expected = await createAuthToken();
  if (!expected || token.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
