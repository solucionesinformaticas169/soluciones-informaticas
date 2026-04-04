"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/admin/login/actions";
import BrandMark from "@/app/components/BrandMark";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn-primary w-full justify-center" disabled={pending}>
      {pending ? "Ingresando..." : "Ingresar al panel"}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-[30rem] rounded-[2rem] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
      <div className="flex flex-col items-center text-center">
        <BrandMark width={250} priority />
        <h1 className="mt-8 text-3xl font-semibold text-slate-950">Acceso administrativo</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
          Ingresa al panel para revisar citas, servicios y el seguimiento de tu operacion.
        </p>
      </div>

      <div className="mt-8 space-y-5">
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-800">Correo admin</span>
        <input name="email" type="email" className="form-input" placeholder="admin@empresa.com" required />
      </label>

      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-800">Contrasena</span>
        <input name="password" type="password" className="form-input" placeholder="********" required />
      </label>

      {state.error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p> : null}

      <SubmitButton />
      </div>
    </form>
  );
}
