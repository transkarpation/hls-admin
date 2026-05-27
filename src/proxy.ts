import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function roleHomePath(role: string | undefined) {
  return role === "admin" ? "/dashboard" : "/not-implemented";
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) return;

  if (pathname === "/login") {
    if (isLoggedIn) {
      return Response.redirect(new URL(roleHomePath(role), req.url));
    }
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }

  if (pathname === "/") {
    return Response.redirect(new URL(roleHomePath(role), req.url));
  }

  if (pathname.startsWith("/dashboard") && role !== "admin") {
    return Response.redirect(new URL("/not-implemented", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/videos|api/crons).*)"],
};
