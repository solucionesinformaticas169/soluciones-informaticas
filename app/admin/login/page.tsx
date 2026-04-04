import Link from "next/link";
import LoginForm from "@/app/admin/login/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="section min-h-[85vh]">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800">
          <span>&lt;</span>
          <span>Volver al sitio</span>
        </Link>
      </div>

      <div className="flex min-h-[70vh] items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
