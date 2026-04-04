"use client";

import { useState } from "react";
import Link from "next/link";
import { WhatsAppIcon } from "@/app/components/ContactIcons";

export default function FloatingPrompt() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)] sm:bottom-6 sm:left-6">
      <div className="pointer-events-auto relative w-full max-w-[18rem] rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:max-w-[19rem]">
        <div className="absolute -bottom-3 -left-3 flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-100 bg-brand-500 text-white shadow-[0_12px_30px_rgba(49,141,255,0.35)]">
          <WhatsAppIcon className="h-4.5 w-4.5" />
        </div>

        <p className="pr-6 text-lg font-semibold leading-tight text-slate-950">
          ¿Listo para automatizar o lanzar tu sistema?
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Agenda una cita para hablar de software, IA, apps y automatizacion para tu negocio.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/agendar" className="inline-flex items-center rounded-full bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400">
            Agendar cita
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
