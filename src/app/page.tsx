import Link from "next/link";

export default function HomePage() {
  return (
    <main className="login-page">
      <div className="login-card">
        <p className="brand-mark">REPORTING</p>
        <h1>활동보고서</h1>
        <p className="lede tight">
          팀 워크스페이스 주소로 접속하세요.
          <br />
          예: <code>/w/innosight</code>
        </p>
        <p className="hint" style={{ marginTop: "1rem" }}>
          관리자는{" "}
          <Link href="/admin" style={{ color: "var(--teal-deep)", fontWeight: 700 }}>
            /admin
          </Link>
          에서 워크스페이스를 발급합니다.
        </p>
      </div>
    </main>
  );
}
