# 🚨 PROJECT DEVELOPMENT RULES

## **CRITICAL: PRE-COMMIT CHECKLIST**

**❌ NEVER PUSH CODE WITHOUT COMPLETING ALL STEPS BELOW ❌**

### **1. 🔍 Code Quality Verification**

```bash
# Run ALL of these commands and fix any issues:
npm run lint          # Check for linting errors
npm run format:check   # Check formatting
npm run format         # Fix formatting automatically
npm run type-check     # Check TypeScript types
npm run test          # Run unit tests
npm run build         # Verify build works
```

### **2. 📝 Manual Verification**

- [ ] **No `console.log` statements** (except in error handling)
- [ ] **No commented-out code** (unless temporarily needed with TODO)
- [ ] **All TypeScript errors resolved**
- [ ] **All ESLint warnings addressed**
- [ ] **Prettier formatting applied**
- [ ] **Tests pass locally**
- [ ] **Build succeeds locally**

### **3. 🔄 Git Workflow**

```bash
# Proper commit sequence:
git add .
npm run lint && npm run format && npm run type-check && npm run test && npm run build
# Only commit if ALL commands pass:
git commit -m "descriptive commit message"
git push origin main
```

---

## **🛠️ DEVELOPMENT STANDARDS**

### **Code Quality**

- **Always run linting before commits**
- **Use TypeScript strictly** - no `any` types without justification
- **Write meaningful commit messages**
- **Keep functions small and focused**
- **Add comments for complex logic**

### **Error Handling**

- **Use proper error boundaries in React**
- **Log errors with `console.error` (allowed)**
- **Handle async operations with try/catch**
- **Provide user-friendly error messages**

### **Testing**

- **Write tests for new features**
- **Update tests when changing functionality**
- **Ensure E2E tests reflect actual behavior**
- **Mock external dependencies properly**

### **Environment Variables**

- **Never commit `.env` files**
- **Document required env vars in README**
- **Use proper env var validation**
- **Provide example `.env.example` files**

---

## **🚀 CI/CD PIPELINE RULES**

### **Before Enabling Features**

- **Test locally first**
- **Verify all environment variables are available**
- **Check that database connections work**
- **Ensure secrets are properly configured**

### **Deployment Checklist**

- [ ] **CI pipeline passes completely**
- [ ] **All tests pass in CI environment**
- [ ] **Build succeeds in CI**
- [ ] **Security audit passes (or issues are addressed)**
- [ ] **Environment-specific configs are correct**

---

## **📁 FILE ORGANIZATION**

### **Naming Conventions**

- **Components**: PascalCase (`UserProfile.tsx`)
- **Files**: kebab-case (`user-profile.ts`)
- **Directories**: kebab-case (`user-management/`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### **Import Organization**

```typescript
// 1. External libraries
import React from 'react';
import { NextRequest } from 'next/server';

// 2. Internal utilities/configs
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// 3. Components
import { Button } from '@/components/ui/Button';

// 4. Types
import type { User } from '@/types/user';
```

---

## **🔒 SECURITY RULES**

### **Authentication & Authorization**

- **Never expose sensitive data in client-side code**
- **Validate all user inputs**
- **Use proper session management**
- **Implement CSRF protection**
- **Sanitize database queries**

### **Environment Security**

- **Rotate secrets regularly**
- **Use different secrets for different environments**
- **Never log sensitive information**
- **Implement proper rate limiting**

---

## **📚 DOCUMENTATION RULES**

### **Code Documentation**

- **Document complex functions with JSDoc**
- **Explain business logic in comments**
- **Keep README.md updated**
- **Document API endpoints**
- **Maintain changelog for major changes**

### **Commit Messages**

```
feat: add user authentication system
fix: resolve database connection timeout
docs: update API documentation
refactor: simplify auth callback logic
test: add E2E tests for signup flow
chore: update dependencies
```

---

## **⚡ PERFORMANCE RULES**

### **Code Performance**

- **Optimize database queries**
- **Use proper React hooks (useMemo, useCallback)**
- **Implement proper loading states**
- **Minimize bundle size**
- **Use proper caching strategies**

### **Build Performance**

- **Keep dependencies minimal**
- **Use dynamic imports for large components**
- **Optimize images and assets**
- **Enable proper compression**

---

## **🚨 EMERGENCY PROCEDURES**

### **If CI/CD Fails**

1. **Don't panic** - check the logs first
2. **Fix issues locally** before pushing again
3. **Test the fix thoroughly**
4. **Consider rolling back** if fix is complex
5. **Document the issue** for future reference

### **If Production Breaks**

1. **Use rollback workflow** immediately
2. **Create incident report**
3. **Fix in development environment**
4. **Test thoroughly before redeploying**
5. **Post-mortem analysis**

---

## **✅ AUTOMATION HELPERS**

### **Pre-commit Hook Setup** (Recommended)

```bash
# Install husky for git hooks
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run format && npm run type-check && npm run test"
```

### **VS Code Settings** (Recommended)

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

---

## **🎯 SUMMARY**

**THE GOLDEN RULE: If any command fails, DO NOT COMMIT OR PUSH**

```bash
# This should ALWAYS pass before any commit:
npm run lint && npm run format && npm run type-check && npm run test && npm run build
```

**Remember: It's better to spend 5 minutes fixing issues locally than 30 minutes debugging CI failures!**
