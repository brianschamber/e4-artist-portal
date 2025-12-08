// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard",
    "/profile",
    "/releases/:path*",
    "/tracks/:path*",
    "/earnings/:path*",
    "/settings/:path*",
  ],
};
