import { hashSecret, safeEqual } from "@/lib/crypto-hash";

export const WORKSPACE_COOKIE = "ws_gate";

export async function createWorkspaceToken(
  workspaceSlug: string,
  passwordHash: string,
) {
  return hashSecret(`ws:${workspaceSlug}:${passwordHash}`);
}

export async function verifyWorkspacePassword(
  input: string,
  passwordHash: string,
) {
  const left = await hashSecret(input);
  return safeEqual(left, passwordHash);
}

export async function isValidWorkspaceToken(
  token: string | undefined,
  workspaceSlug: string,
  passwordHash: string,
) {
  if (!token) return false;
  const expected = await createWorkspaceToken(workspaceSlug, passwordHash);
  return safeEqual(token, expected);
}

/** cookie value: `${slug}.${token}` */
export function encodeWorkspaceCookie(workspaceSlug: string, token: string) {
  return `${workspaceSlug}.${token}`;
}

export function decodeWorkspaceCookie(raw: string | undefined) {
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  return {
    slug: raw.slice(0, dot),
    token: raw.slice(dot + 1),
  };
}
