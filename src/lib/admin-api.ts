export type AdminApiResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export async function postAdminApi<T extends object = object>(
  path: string,
  body: unknown,
): Promise<AdminApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "manual",
    });

    if (response.type === "opaqueredirect" || response.status === 401) {
      return { ok: false, error: "관리자 로그인이 필요합니다. 새로고침 후 다시 로그인하세요." };
    }

    const data = (await response.json().catch(() => null)) as
      | AdminApiResult<T>
      | null;
    if (!data) {
      return { ok: false, error: `요청에 실패했습니다. (${response.status})` };
    }
    return data;
  } catch {
    return { ok: false, error: "네트워크 오류로 요청에 실패했습니다." };
  }
}
