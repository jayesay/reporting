/** @deprecated workspace/admin auth로 대체. 하위 호환 re-export */
export { hashSecret } from "@/lib/crypto-hash";
export {
  ADMIN_COOKIE as AUTH_COOKIE,
  getAdminPassword as getSitePassword,
  createAdminToken as createAuthToken,
  verifyAdminPassword as verifySitePassword,
  isValidAdminToken as isValidAuthToken,
} from "@/lib/admin-auth";
