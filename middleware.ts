import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/releases/:path*",
    "/tracks/:path*",
    "/earnings/:path*",
    "/settings/:path*",
  ],
};
