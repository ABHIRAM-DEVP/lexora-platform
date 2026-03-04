import { NextResponse } from "next/server";

export function middleware(req: any) {
  const token = req.cookies.get("accessToken");

  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}