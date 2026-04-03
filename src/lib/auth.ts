/**
 * NextAuth configuration
 */

import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const credentialsOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Wallet",
      credentials: {
        address: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.address) return null;
        const user = await prisma.user.findUnique({
          where: { walletAddress: credentials.address as string },
        });
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.displayName ?? user.name ?? null,
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        if (token.role) (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/login" },
} satisfies NextAuthConfig;

// NextAuth v5: capture both auth and handlers from the same instance
const nextAuthInstance = NextAuth(credentialsOptions);
export const { auth, handlers } = nextAuthInstance;

// Legacy compat shim for NextAuth v4 API usage in v5 codebase
export async function getServerSession(_options?: unknown) {
  return auth();
}

// Legacy authOptions (kept for code that references it)
export const authOptions = credentialsOptions;
