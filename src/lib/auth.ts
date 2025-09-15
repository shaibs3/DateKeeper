import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { config, validateEnvironment } from '@/lib/config';

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
      console.log('🔐 SignIn callback started');
      console.log('📧 User email:', user.email);
      console.log('👤 User data:', JSON.stringify({ id: user.id, name: user.name, email: user.email }, null, 2));
      console.log('🔑 Account data:', JSON.stringify({ provider: account?.provider, type: account?.type }, null, 2));
      
      if (!user.email) {
        console.error('❌ No email provided');
        return false;
      }

      try {
        console.log('🔍 Checking if user exists in database...');
        const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
        console.log('👥 Existing user found:', !!existingUser);

        if (!existingUser) {
          console.log('👤 Creating new user...');
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || '',
              image: user.image || null,
            },
          });
          console.log('✅ New user created successfully:', newUser.id);
          return true;
        } else {
          console.log('✅ Existing user sign-in successful:', existingUser.id);
          return true;
        }
      } catch (error) {
        console.error('❌ Database error in signIn callback:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          meta: error.meta
        });
        return false;
      }
    },
    async session({ session, token }) {
      console.log('🎫 Session callback started');
      console.log('📧 Session email:', session.user?.email);
      
      if (session.user?.email) {
        try {
          console.log('🔍 Looking up user in database for session...');
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          });
          
          if (dbUser) {
            session.user.id = dbUser.id;
            console.log('✅ Session user ID set:', dbUser.id);
          } else {
            console.warn('⚠️ User not found in database for session');
          }
        } catch (error) {
          console.error('❌ Database error in session callback:', error);
        }
      }
      
      console.log('🎫 Session callback completed');
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
