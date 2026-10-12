import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="login-page">
      <div className="login-card">
        <p className="brand-mark">ADMIN</p>
        <h1>워크스페이스 관리</h1>
        <p className="lede tight">관리자 비밀번호를 입력해 주세요.</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
