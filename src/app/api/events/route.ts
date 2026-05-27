import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { broadcast, broadcastToAdmins } from "@/lib/ws-server";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { type, data, adminsOnly } = body;

  if (!type) {
    return NextResponse.json(
      { error: "type is required" },
      { status: 400 }
    );
  }

  const event = { type, ...data };

  if (adminsOnly) {
    broadcastToAdmins(event, session.user.id);
  } else {
    broadcast(event);
  }

  return NextResponse.json({ ok: true, type });
}
