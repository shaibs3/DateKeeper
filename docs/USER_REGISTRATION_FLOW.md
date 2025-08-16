# User Registration Flow

This document explains how the user registration system works in DateKeeper.

## 🎯 Flow Overview

DateKeeper now enforces a proper registration flow:

1. **New users** must use the **Sign Up** page to create an account
2. **Existing users** must use the **Sign In** page to access their account
3. **Cross-flow attempts** are blocked with helpful error messages

## 🔐 How It Works

### Sign In Flow (`/auth/signin`)

1. User clicks "Sign in with Google"
2. Google OAuth completes
3. System checks if user exists in database
4. **If user exists:** ✅ Sign in successful
5. **If user doesn't exist:** ❌ Redirected to error page with "Account Not Found" message

### Sign Up Flow (`/auth/signup`)

1. User clicks "Sign up with Google"
2. Google OAuth completes with `signup=true` parameter
3. System checks if user exists in database
4. **If user doesn't exist:** ✅ Account created and signed in
5. **If user already exists:** ❌ Redirected to error page with "Account Already Exists" message

## 🛠️ Technical Implementation

### Authentication Callback

The system uses the `callbackUrl` parameter to determine the flow:

```typescript
// Sign In (no parameter)
await signIn('google', { callbackUrl: '/home' });

// Sign Up (with signup parameter)
await signIn('google', { callbackUrl: '/home?signup=true' });
```

### Database Check

In the `signIn` callback:

```typescript
const isSignUpFlow = callbackUrl.includes('signup=true');
const existingUser = await prisma.user.findUnique({ where: { email: user.email } });

if (!existingUser && !isSignUpFlow) {
  return '/auth/error?error=UserNotRegistered';
}

if (existingUser && isSignUpFlow) {
  return '/auth/error?error=UserAlreadyExists';
}
```

## 📱 User Experience

### Scenario 1: New User Tries to Sign In

1. Goes to `/auth/signin`
2. Clicks "Sign in with Google"
3. Gets error: "Account Not Found"
4. Button to "Sign Up" redirects to `/auth/signup`

### Scenario 2: Existing User Tries to Sign Up

1. Goes to `/auth/signup`
2. Clicks "Sign up with Google"
3. Gets error: "Account Already Exists"
4. Button to "Sign In" redirects to `/auth/signin`

### Scenario 3: Correct Flow

1. **New users** → Sign Up → Account Created → Home
2. **Existing users** → Sign In → Authenticated → Home

## 🧪 Testing the Flow

### Test New User Registration

1. Clear your database or use a new email
2. Go to http://localhost:3000/auth/signin
3. Try to sign in → Should get "Account Not Found" error
4. Click "Sign Up" → Go to signup page
5. Sign up → Should create account and sign in

### Test Existing User Sign In

1. Use an email that exists in the database
2. Go to http://localhost:3000/auth/signup
3. Try to sign up → Should get "Account Already Exists" error
4. Click "Sign In" → Go to signin page
5. Sign in → Should authenticate successfully

### Test Normal Flows

1. **New user on signup page** → Creates account ✅
2. **Existing user on signin page** → Signs in ✅

## 🎯 Benefits

1. **Clear User Intent** - Users explicitly choose to sign up or sign in
2. **Better UX** - Helpful error messages guide users to correct action
3. **Data Integrity** - No accidental account creation
4. **Security** - Users know exactly what action they're taking
5. **Debugging** - Clear flow tracking for support

## 🔧 Configuration

The flow is controlled in `src/lib/auth.ts`:

```typescript
// To disable strict registration (allow auto-creation):
// Remove the signup parameter check and always create users

// To modify error messages:
// Update src/app/auth/error/page.tsx

// To change redirect URLs:
// Update the signIn calls in signin/signup pages
```

## 📊 Database Impact

- **Users table**: Only created when explicitly signing up
- **No ghost accounts**: Prevents accidental user creation
- **Clean data**: All users intentionally registered

This ensures your user database contains only legitimate, intentional registrations! 🎉
