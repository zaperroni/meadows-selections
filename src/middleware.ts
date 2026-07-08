import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  if (!expectedPassword) return NextResponse.next();

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const separatorIndex = decoded.indexOf(":");
    const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : decoded;
    if (password === expectedPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Builder Dashboard"' },
  });
}

export const config = {
  matcher: ["/"],
};
