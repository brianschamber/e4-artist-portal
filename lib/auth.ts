// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Uses NEXTAUTH_SECRET from .env.local
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Look up user by email in Neon
        const result = await query(
          `
          SELECT user_id,
                 email,
                 password_hash,
                 artist_id,
                 role,
                 email_verified
          FROM users
          WHERE email = $1
        `,
          [credentials.email]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const user = result.rows[0];

        // Require verified email
        if (user.email_verified === false) {
          throw new Error("Email not verified");
        }

        // Validate password
        const isValid = await compare(
          credentials.password,
          user.password_hash
        );
        if (!isValid) {
          return null;
        }

        // Returned object becomes the "user" in jwt() callback
        return {
          id: user.user_id,
          email: user.email,
          artistId: user.artist_id,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Merge user data into token at login
      if (user) {
        token.userId = (user as any).id;
        token.artistId = (user as any).artistId;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose token fields to `session.user`
      if (session.user) {
        (session.user as any).userId = token.userId;
        (session.user as any).artistId = token.artistId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};
