"use server";

import { redirect } from "next/navigation";
import { createAdminSession, isAdminConfigured } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) {
    return {
      error: "Configura ADMIN_EMAIL y ADMIN_PASSWORD en tu entorno para habilitar el acceso."
    };
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return {
      error: "Credenciales invalidas."
    };
  }

  await createAdminSession(email);
  redirect("/admin");
}
