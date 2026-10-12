import { hashSecret, safeEqual } from "@/lib/crypto-hash";

export const ADMIN_COOKIE = "admin_gate";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

export async function createAdminToken() {
  const password = getAdminPassword();
  if (!password) return "";
  return hashSecret(`admin:${password}`);
}

export async function verifyAdminPassword(input: string) {
  const expected = getAdminPassword();
  if (!expected) return false;
  return safeEqual(
    await hashSecret(`admin:${input}`),
    await hashSecret(`admin:${expected}`),
  );
}

export async function isValidAdminToken(token: string | undefined) {
  if (!token) return false;
  const expected = await createAdminToken();
  if (!expected) return false;
  return safeEqual(token, expected);
}
