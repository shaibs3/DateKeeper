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
      console.log('🔐 =================================');
      console.log('🔐 SIGNIN CALLBACK STARTED');
      console.log('🔐 =================================');
      console.log('📧 User email:', user.email);
      console.log('👤 Full user object:', JSON.stringify(user, null, 2));
      console.log('🔑 Full account object:', JSON.stringify(account, null, 2));
      console.log('👤 Full profile object:', JSON.stringify(profile, null, 2));

      // Step 1: Validate email
      if (!user.email) {
        console.error('❌ STEP 1 FAILED: No email provided in user object');
        console.log('🔐 SIGNIN CALLBACK RETURNING FALSE - NO EMAIL');
        return false;
      }
      console.log('✅ STEP 1 PASSED: Email validation successful');

      try {
        // Step 2: Database connection test
        console.log('🔍 STEP 2: Testing database connection...');
        console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);
        console.log('🔍 DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 20) + '...');
        
        // Step 3: Check if user exists
        console.log('🔍 STEP 3: Checking if user exists in database...');
        const existingUser = await prisma.user.findUnique({ 
          where: { email: user.email },
          select: { id: true, email: true, name: true }
        });
        console.log('👥 STEP 3 RESULT: Existing user found:', !!existingUser);
        if (existingUser) {
          console.log('👥 Existing user details:', JSON.stringify(existingUser, null, 2));
        }

        if (!existingUser) {
          // Step 4: Create new user
          console.log('👤 STEP 4: Creating new user...');
          console.log('👤 User data to create:', {
            email: user.email,
            name: user.name || '',
            image: user.image || null,
          });
          
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || '',
              image: user.image || null,
            },
          });
          console.log('✅ STEP 4 SUCCESS: New user created:', JSON.stringify(newUser, null, 2));
          console.log('🔐 SIGNIN CALLBACK RETURNING TRUE - NEW USER CREATED');
          return true;
        } else {
          // Step 5: Existing user login
          console.log('✅ STEP 5 SUCCESS: Existing user sign-in successful');
          console.log('🔐 SIGNIN CALLBACK RETURNING TRUE - EXISTING USER');
          return true;
        }
      } catch (error) {
        console.error('❌ FATAL ERROR in signIn callback');
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error instanceof Error:', error instanceof Error);
        console.error('❌ Raw error:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
        
        // Enhanced Prisma error logging
        if (error && typeof error === 'object') {
          console.error('❌ Error properties:', Object.keys(error));
          console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: (error as any)?.code,
            meta: (error as any)?.meta,
            name: (error as any)?.name,
          });
        }
        
        console.log('🔐 SIGNIN CALLBACK RETURNING FALSE - DATABASE ERROR');
        return false;
      }
    },
    async session({ session }) {
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
