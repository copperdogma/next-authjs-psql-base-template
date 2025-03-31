import { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import NextAuth from 'next-auth';

export const authConfig: NextAuthOptions = {
  providers: [
    Google({
      clientId: (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_CLIENT_ID)!,
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_CLIENT_SECRET)!,
    }),
  ],
  // Only use custom pages when there are multiple providers or for specific scenarios
  // We'll remove this for now to avoid the unnecessary redirect
  // pages: {
  //   signIn: '/login',
  // },
  callbacks: {
    // Add user ID to the session
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    // Persist the user ID onto the token right after signin
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
