"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminAppointmentsFilters({
  initialFrom,
  initialTo
}: {
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!from || !to) {
      setError("Selecciona fechas.");
      return;
    }

    if (from && to && to < from) {
      setError("La fecha hasta no puede ser anterior a la fecha desde.");
      return;
    }

    setError("");

    const params = new URLSearchParams(searchParams.toString());

    if (from) {
      params.set("from", from);
    } else {
      params.delete("from");
    }

    if (to) {
      params.set("to", to);
    } else {
      params.delete("to");
    }

    router.push(`/admin/appointments${params.toString() ? `?${params.toString()}` : ""}` as Route);
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">Desde</span>
          <input
            type="date"
            name="from"
            value={from}
            max={to || undefined}
            onChange={(event) => {
              const nextFrom = event.target.value;
              setFrom(nextFrom);

              if (to && nextFrom && to < nextFrom) {
                setTo(nextFrom);
              }

              setError("");
            }}
            className="form-input"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-800">Hasta</span>
          <input
            type="date"
            name="to"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value);
              setError("");
            }}
            className="form-input"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setError("");
              router.push("/admin/appointments");
            }}
            className="inline-flex items-center rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            Limpiar
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}
