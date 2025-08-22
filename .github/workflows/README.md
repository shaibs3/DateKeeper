# 🚀 Deployment Workflows Documentation

## Overview

This repository uses a modern CI/CD pipeline with GitHub Actions and Vercel for deployments. Here's how the workflows are organized:

## 📋 Workflow Files

### 1. `ci.yml` - Continuous Integration
**Triggers:** Push/PR to `main` or `develop`

**What it does:**
- ✅ Code quality checks (linting, formatting, type checking)
- ✅ Unit tests with coverage
- ✅ Build verification
- ✅ E2E tests with database
- ✅ Security audit

### 2. `deploy-staging.yml` - Staging Deployment
**Triggers:** 
- Push to `develop` branch
- Pull requests to `main` branch
- Manual dispatch

**What it does:**
- ✅ Runs quality checks
- ✅ Deploys to staging environment
- ✅ Assigns custom domain (`datekeeper-staging.vercel.app`)
- ✅ Runs health checks
- ✅ Runs E2E tests against staging
- ✅ Comments on PRs with staging URL

### 3. `deploy-production.yml` - Production Deployment
**Triggers:**
- Push to `main` branch
- Manual dispatch (with option to skip tests)

**Environment:** `production` (requires approval)

**What it does:**
- ✅ Runs full test suite
- ✅ Deploys to production environment
- ✅ Runs health checks
- ✅ Runs smoke tests
- ✅ Creates GitHub release
- ✅ Emergency deployment option (skip tests)

### 4. `rollback.yml` - Emergency Rollback
**Triggers:** Manual dispatch only

**What it does:**
- 🔄 Rolls back to previous production deployment
- ✅ Verifies rollback with health check
- 📝 Creates issue to track follow-up
- 🚨 Emergency response workflow

### 5. `e2e-tests.yml` - Standalone E2E Tests
**Triggers:** Push/PR to `main` or `develop`

**What it does:**
- 🧪 Runs full E2E test suite
- 📊 Uploads test reports on failure
- 🔍 Independent test verification

## 🔐 Required Secrets

### Repository Secrets
Add these in **Settings → Secrets and variables → Actions**:

```
VERCEL_TOKEN          # Vercel deployment token
VERCEL_ORG_ID         # Your Vercel organization ID
VERCEL_PROJECT_ID     # Your Vercel project ID
```

### Getting Vercel Secrets

1. **VERCEL_TOKEN**:
   - Go to [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens)
   - Create token named "GitHub Actions"

2. **VERCEL_ORG_ID**:
   - Go to [Vercel Dashboard → Settings → General](https://vercel.com/account)
   - Copy "Team ID"

3. **VERCEL_PROJECT_ID**:
   - Go to your project → Settings → General
   - Copy "Project ID"

## 🌍 GitHub Environments

### Staging Environment
- **Name:** `staging`
- **URL:** `https://datekeeper-staging.vercel.app`
- **Protection:** None (auto-deploy)

### Production Environment
- **Name:** `production`
- **URL:** `https://datekeeper.vercel.app`
- **Protection:** 
  - ✅ Required reviewers
  - ✅ Wait timer (optional)
  - ✅ Deployment branches: `main` only

## 🔄 Deployment Flow

### Normal Development Flow

1. **Feature Development**
   ```
   develop branch → Push → Staging Deployment
   ```

2. **Pull Request**
   ```
   PR to main → CI checks + Staging deployment → Review
   ```

3. **Production Release**
   ```
   Merge to main → Production deployment (requires approval)
   ```

### Emergency Deployment

```
Manual dispatch → Production deployment (skip tests) → Health check
```

### Emergency Rollback

```
Manual dispatch → Rollback → Health check → Issue creation
```

## 📊 Deployment URLs

- **Production:** https://datekeeper.vercel.app
- **Staging:** https://datekeeper-staging.vercel.app

## 🛠️ Manual Actions

### Deploy to Staging
1. Go to **Actions** tab
2. Select "Deploy to Staging"
3. Click "Run workflow"

### Deploy to Production
1. Go to **Actions** tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Approve the deployment (if protection rules are enabled)

### Emergency Rollback
1. Go to **Actions** tab
2. Select "Rollback Production"
3. Click "Run workflow"
4. Enter rollback reason
5. Approve the rollback

## 🔍 Monitoring

- **GitHub Actions:** Monitor workflow runs in the Actions tab
- **Vercel Dashboard:** Monitor deployments and analytics
- **GitHub Releases:** Track production deployments
- **Issues:** Rollback tracking and incident management

## 🚨 Troubleshooting

### Common Issues

1. **Deployment fails:**
   - Check logs in Actions tab
   - Verify secrets are correct
   - Check Vercel project settings

2. **Health checks fail:**
   - Verify API endpoints are working
   - Check environment variables in Vercel
   - Review application logs

3. **E2E tests fail:**
   - Check staging environment
   - Review test configuration
   - Verify test data setup

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review Vercel deployment logs
3. Check this documentation
4. Create an issue with the error details