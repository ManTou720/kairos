import { NextResponse } from "next/server";

export const jsonError = (status: number, error: string) =>
  NextResponse.json({ error }, { status });

export const unauthorized = () => jsonError(401, "Unauthorized");
