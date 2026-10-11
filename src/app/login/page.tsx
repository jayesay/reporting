import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/";

  return (
    <main className="login-page">
      <div className="login-card">
        <p className="brand-mark">INNOSIGHT</p>
        <h1>활동보고서</h1>
        <p className="lede tight">팀 공통 비밀번호를 입력해 주세요.</p>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense
      fallback={
        <main className="login-page">
          <div className="login-card">
            <p className="brand-mark">INNOSIGHT</p>
            <h1>활동보고서</h1>
          </div>
        </main>
      }
    >
      <LoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}
