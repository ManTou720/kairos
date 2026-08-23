import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/server/lib/auth";
import { unauthorized } from "@/server/lib/http";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return unauthorized();
  return NextResponse.json({ user });
}
