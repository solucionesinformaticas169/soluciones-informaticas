"use server";

import { redirect } from "next/navigation";
import { createAdminSession, getAdminCredentials, isAdminConfigured } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) {
    return {
      error: "Configura ADMIN_USERNAME y ADMIN_PASSWORD en tu entorno para habilitar el acceso."
    };
  }

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const adminCredentials = getAdminCredentials();

  if (username !== adminCredentials.username || password !== adminCredentials.password) {
    return {
      error: "Credenciales invalidas."
    };
  }

  await createAdminSession(username);
  redirect("/admin");
}
