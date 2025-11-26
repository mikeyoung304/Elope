#!/bin/bash
# scripts/verify-build.sh
# Pre-deployment build verification script
# Simulates Vercel's clean build environment

set -e  # Exit on any error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Vercel Build Verification Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Clean build artifacts (simulate fresh Vercel environment)
echo -e "${YELLOW}🧹 Step 1: Cleaning build artifacts...${NC}"
echo "   - Removing packages/*/dist"
echo "   - Removing packages/*/.tsbuildinfo"
echo "   - Removing client/dist"
rm -rf packages/*/dist packages/*/.tsbuildinfo client/dist

if [ -d packages/contracts/dist ] || [ -d packages/shared/dist ] || [ -d client/dist ]; then
  echo -e "${RED}❌ ERROR: Failed to clean dist folders${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Clean complete${NC}"
echo ""

# Step 2: Verify build scripts have --force flag
echo -e "${YELLOW}🔍 Step 2: Verifying build scripts...${NC}"

check_build_script() {
  local package=$1
  local package_json="packages/$package/package.json"

  if [ ! -f "$package_json" ]; then
    echo -e "${RED}❌ ERROR: $package_json not found${NC}"
    exit 1
  fi

  if grep -q '"build".*--force' "$package_json"; then
    echo -e "${GREEN}   ✅ $package: build script has --force flag${NC}"
  else
    echo -e "${RED}   ❌ $package: build script missing --force flag${NC}"
    exit 1
  fi
}

check_build_script "contracts"
check_build_script "shared"
echo ""

# Step 3: Build packages in dependency order
echo -e "${YELLOW}🔨 Step 3: Building packages...${NC}"

echo "   - Building @macon/contracts..."
npm run build --workspace=@macon/contracts
if [ ! -f packages/contracts/dist/index.js ]; then
  echo -e "${RED}❌ ERROR: packages/contracts/dist/index.js not found${NC}"
  exit 1
fi
echo -e "${GREEN}   ✅ contracts built successfully${NC}"

echo "   - Building @macon/shared..."
npm run build --workspace=@macon/shared
if [ ! -f packages/shared/dist/index.js ]; then
  echo -e "${RED}❌ ERROR: packages/shared/dist/index.js not found${NC}"
  exit 1
fi
echo -e "${GREEN}   ✅ shared built successfully${NC}"
echo ""

# Step 4: Verify Vite alias configuration
echo -e "${YELLOW}🔍 Step 4: Verifying Vite configuration...${NC}"

if grep -q '@macon/contracts.*dist/index\.js' client/vite.config.ts; then
  echo -e "${GREEN}   ✅ Vite alias points to contracts/dist/index.js${NC}"
else
  echo -e "${RED}   ❌ Vite alias does not point to contracts/dist/index.js${NC}"
  exit 1
fi

if grep -q '@macon/shared.*dist/index\.js' client/vite.config.ts; then
  echo -e "${GREEN}   ✅ Vite alias points to shared/dist/index.js${NC}"
else
  echo -e "${RED}   ❌ Vite alias does not point to shared/dist/index.js${NC}"
  exit 1
fi
echo ""

# Step 5: Build client (Vite)
echo -e "${YELLOW}🔨 Step 5: Building client...${NC}"
npm run build --workspace=@macon/web

if [ ! -f client/dist/index.html ]; then
  echo -e "${RED}❌ ERROR: client/dist/index.html not found${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Client built successfully${NC}"
echo ""

# Step 6: Verify build outputs
echo -e "${YELLOW}📦 Step 6: Verifying build outputs...${NC}"

verify_file() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    local size=$(ls -lh "$file" | awk '{print $5}')
    echo -e "${GREEN}   ✅ $description ($size)${NC}"
  else
    echo -e "${RED}   ❌ $description not found${NC}"
    exit 1
  fi
}

verify_file "packages/contracts/dist/index.js" "contracts/dist/index.js"
verify_file "packages/contracts/dist/index.d.ts" "contracts/dist/index.d.ts"
verify_file "packages/shared/dist/index.js" "shared/dist/index.js"
verify_file "packages/shared/dist/index.d.ts" "shared/dist/index.d.ts"
verify_file "client/dist/index.html" "client/dist/index.html"
echo ""

# Step 7: TypeScript type checking
echo -e "${YELLOW}🔍 Step 7: Running TypeScript type checking...${NC}"
if npm run typecheck > /dev/null 2>&1; then
  echo -e "${GREEN}✅ TypeScript type checking passed${NC}"
else
  echo -e "${RED}❌ TypeScript type checking failed${NC}"
  echo "   Run 'npm run typecheck' for details"
  exit 1
fi
echo ""

# Step 8: Verify vercel.json configuration
echo -e "${YELLOW}🔍 Step 8: Verifying vercel.json...${NC}"

if [ ! -f vercel.json ]; then
  echo -e "${RED}❌ ERROR: vercel.json not found${NC}"
  exit 1
fi

if grep -q '"framework": "vite"' vercel.json; then
  echo -e "${GREEN}   ✅ Framework set to 'vite'${NC}"
else
  echo -e "${YELLOW}   ⚠️  Framework not set to 'vite'${NC}"
fi

if grep -q '"outputDirectory": "client/dist"' vercel.json; then
  echo -e "${GREEN}   ✅ Output directory set to 'client/dist'${NC}"
else
  echo -e "${RED}   ❌ Output directory not set to 'client/dist'${NC}"
  exit 1
fi

if grep -q 'npm ci --workspaces' vercel.json; then
  echo -e "${GREEN}   ✅ Install command uses 'npm ci --workspaces'${NC}"
else
  echo -e "${YELLOW}   ⚠️  Install command does not use 'npm ci --workspaces'${NC}"
fi
echo ""

# Success summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ All verification checks passed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Build outputs verified:${NC}"
echo "   - packages/contracts/dist/index.js"
echo "   - packages/shared/dist/index.js"
echo "   - client/dist/index.html"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "   1. Run 'vercel --prod' to deploy"
echo "   2. Monitor Vercel build logs for any warnings"
echo "   3. Test production deployment after deploy completes"
echo ""
