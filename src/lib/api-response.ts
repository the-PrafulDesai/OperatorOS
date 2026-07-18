import { NextResponse } from "next/server";
export const apiSuccess = <T>(data: T, status = 200) =>
  NextResponse.json({ success: true, data }, { status });
export const apiError = (code: string, message: string, status: number) =>
  NextResponse.json({ success: false, error: { code, message } }, { status });
