import { NextResponse } from "next/server";
import { processPendingNotificationJobs } from "@/lib/notifications";

function isAuthorized(request: Request) {
  const secret = process.env.NOTIFICATION_PROCESSOR_SECRET;

  if (!secret && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  return authHeader === `Bearer ${secret}` || querySecret === secret;
}

async function handleProcess(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const summary = await processPendingNotificationJobs();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("No se pudieron procesar las notificaciones pendientes.", error);
    return NextResponse.json({ error: "No se pudieron procesar las notificaciones pendientes." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleProcess(request);
}

export async function POST(request: Request) {
  return handleProcess(request);
}
