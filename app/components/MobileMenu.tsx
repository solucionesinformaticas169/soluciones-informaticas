"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!isOpen || !menuRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative z-30 md:hidden">
      {isOpen ? <button aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-transparent" onClick={closeMenu} /> : null}

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
        onClick={() => setIsOpen((current) => !current)}
        className="relative z-40 flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-brand-300/40 hover:bg-white/15"
      >
        <span>Menú</span>
        <span className={`text-xs transition ${isOpen ? "rotate-180" : ""}`}>⌃</span>
      </button>

      {isOpen ? (
        <nav
          id="mobile-menu-panel"
          className="absolute right-0 z-40 mt-3 grid min-w-[230px] gap-2 rounded-[1.5rem] border border-white/10 bg-[#0f1f3d] p-3 shadow-[0_24px_60px_rgba(3,10,23,0.52)]"
        >
          <Link
            href="/agendar"
            onClick={closeMenu}
            className="inline-flex justify-center rounded-full border border-white/10 bg-white/10 px-4 py-3 font-medium text-white transition hover:border-brand-300/40 hover:bg-white/15"
          >
            Agenda cita
          </Link>
          <a
            href="#servicios"
            onClick={closeMenu}
            className="inline-flex justify-center rounded-full border border-white/10 bg-white/10 px-4 py-3 font-medium text-white transition hover:border-brand-300/40 hover:bg-white/15"
          >
            Servicios
          </a>
          <a
            href="#automatizacion"
            onClick={closeMenu}
            className="inline-flex justify-center rounded-full border border-white/10 bg-white/10 px-4 py-3 font-medium text-white transition hover:border-brand-300/40 hover:bg-white/15"
          >
            Automatización
          </a>
          <a
            href="#contacto"
            onClick={closeMenu}
            className="inline-flex justify-center rounded-full border border-white/10 bg-white/10 px-4 py-3 font-medium text-white transition hover:border-brand-300/40 hover:bg-white/15"
          >
            Contacto
          </a>
          <Link
            href="/admin/login"
            onClick={closeMenu}
            className="inline-flex justify-center rounded-full border border-white/10 bg-white/10 px-4 py-3 font-medium text-white transition hover:border-brand-300/40 hover:bg-white/15"
          >
            Login
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
