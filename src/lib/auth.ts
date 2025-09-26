import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { config, validateEnvironment } from '@/lib/config';
import { authLogger } from '@/lib/logger';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Validate environment variables on startup
validateEnvironment();

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: config.auth.google.clientId,
      clientSecret: config.auth.google.clientSecret,
      authorization: {
        params: {
          prompt: 'select_account consent',
        },
      },
    }),
  ],
  debug: config.features.debugMode,
  callbacks: {
    async signIn({ user, account, profile }) {
      authLogger.debug(`Sign-in callback started for email: ${user.email}`);

      // Step 1: Validate email
      if (!user.email) {
        authLogger.error('Sign-in failed: No email provided');
        return false;
      }
      authLogger.debug(`Email validation passed for: ${user.email}`);

      try {
        authLogger.debug(`Checking user existence in database for: ${user.email}`);
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, email: true, name: true },
        });
        authLogger.debug(
          `User lookup result - email: ${user.email}, exists: ${!!existingUser}, id: ${existingUser?.id}`
        );

        if (!existingUser) {
          authLogger.info(`Creating new user: ${user.email}`);

          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || '',
              image: user.image || null,
            },
          });
          authLogger.info(`New user created successfully: ${user.email} with ID ${newUser.id}`);
          return true;
        } else {
          authLogger.info(
            `Existing user sign-in successful: ${user.email} with ID ${existingUser.id}`
          );
          return true;
        }
      } catch (error) {
        authLogger.error(
          `Sign-in callback failed for ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return false;
      }
    },
    async session({ session }) {
      authLogger.debug(`Session callback started for: ${session.user?.email}`);

      if (session.user?.email) {
        try {
          authLogger.debug(`Looking up user for session: ${session.user.email}`);
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          });

          if (dbUser) {
            session.user.id = dbUser.id;
            authLogger.debug(`Session user ID set: ${session.user.email} -> ${dbUser.id}`);
          } else {
            authLogger.warn(`User not found in database for session: ${session.user.email}`);
          }
        } catch (error) {
          authLogger.error(
            `Database error in session callback for ${session.user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      authLogger.debug(`Session callback completed for user: ${session.user?.id}`);
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow sign out to go to the root
      if (url === '/' || url === baseUrl) return baseUrl;
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow URLs from the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: config.auth.secret,
});
