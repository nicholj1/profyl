import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Public routes that don't need auth
  const publicRoutes = ["/", "/login", "/signup", "/privacy", "/terms"]
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/api/public/") ||
    pathname.startsWith("/api/auth/")

  // If accessing protected route without auth, redirect to login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico (favicon)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
