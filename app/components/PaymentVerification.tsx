"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentVerification({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function verify() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/payments/${id}/confirm`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) setMessage(data.message);
      router.refresh();
    } catch { setMessage("No se pudo conectar. No vuelvas a pagar; intenta verificar más tarde."); }
    finally { setBusy(false); }
  }
  return <div className="mt-6">
    <button onClick={verify} disabled={busy} className="btn-primary disabled:opacity-60">{busy ? "Verificando..." : "Volver a verificar el pago"}</button>
    {message && <p role="status" className="mt-3 text-sm text-brand-800">{message}</p>}
  </div>;
}
