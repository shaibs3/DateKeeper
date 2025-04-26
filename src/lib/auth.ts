import Google from 'next-auth/providers/google';
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { OAuthConfig } from 'next-auth/providers';

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

// Mock user for development
const mockUser = {
  id: 'mock-user-id',
  name: 'Mock User',
  email: 'mock@example.com',
  image: null,
};

// Only import Prisma if we have a database URL
const prismaConfig = process.env.DATABASE_URL
  ? {
      adapter: PrismaAdapter(prisma),
    }
  : {};

// Mock Google provider for development
const providers = process.env.NODE_ENV === 'development'
  ? [
      {
        id: 'google',
        name: 'Google',
        type: 'oauth' as const,
        wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
        authorization: { params: { scope: 'openid email profile' } },
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        profile(profile: any) {
          return {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            image: mockUser.image,
          };
        },
      } as OAuthConfig<any>,
    ]
  : [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ];

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  ...prismaConfig,
  providers,
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = process.env.NODE_ENV === 'development' 
          ? mockUser.id 
          : user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/signin',
  },
}); 