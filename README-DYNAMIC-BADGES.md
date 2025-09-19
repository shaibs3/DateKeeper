# Dynamic Coverage Badge Options

## Option 1: Codecov Dynamic Badge (Recommended)

Replace the static coverage badge with this dynamic one:

```markdown
[![Coverage](https://codecov.io/gh/shaibs3/DateKeeper/branch/main/graph/badge.svg)](https://codecov.io/gh/shaibs3/DateKeeper)
```

This badge will automatically update when coverage changes since you already have Codecov integration in `.github/workflows/ci.yml`.

## Option 2: GitHub Actions Badge with Coverage

Add this to your CI workflow to generate coverage badges automatically:

```yaml
# In .github/workflows/ci.yml, add after coverage step:
- name: Generate Coverage Badge
  uses: schneegans/dynamic-badges-action@v1.6.0
  with:
    auth: ${{ secrets.GIST_SECRET }}
    gistID: your-gist-id-here
    filename: coverage.json
    label: Coverage
    message: ${{ steps.coverage.outputs.coverage }}%
    color: ${{ steps.coverage.outputs.coverage > 80 && 'brightgreen' || steps.coverage.outputs.coverage > 60 && 'yellow' || 'red' }}
```

## Option 3: Simple Script-Based Badge Update

Create a script that updates the README automatically:

```bash
# scripts/update-badges.sh
#!/bin/bash
coverage=$(npm run test:coverage --silent | grep "All files" | awk '{print $4}' | sed 's/%//')
sed -i.bak "s/coverage-[0-9.]*%25/coverage-${coverage}%25/g" README.md
echo "Updated coverage badge to ${coverage}%"
```

## Current Setup

Your project already has:

- ✅ Jest coverage reporting
- ✅ Codecov integration in CI
- ✅ Coverage uploads to Codecov

**Recommendation:** Use Option 1 (Codecov badge) for the simplest dynamic solution.
