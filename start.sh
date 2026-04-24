#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NonProfit Connect - Local Development ${NC}"
echo -e "${BLUE}========================================${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo -e "${GREEN}✓ Loaded .env file${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one first.${NC}"
  exit 1
fi

# Step 1: Clean used ports
APP_PORT=${PORT:-3001}
echo -e "\n${YELLOW}→ Cleaning ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup_port $APP_PORT
cleanup_port 5173
echo -e "${GREEN}✓ Ports cleaned${NC}"

# Step 2: Start local PostgreSQL via Homebrew
echo -e "\n${YELLOW}→ Starting PostgreSQL...${NC}"
if pg_isready -q 2>/dev/null; then
  echo -e "${GREEN}✓ PostgreSQL is already running${NC}"
else
  # Try to find and start a Homebrew postgres service
  PG_SERVICE=$(brew services list 2>/dev/null | grep -i postgres | grep -v none | head -1 | awk '{print $1}')
  if [ -n "$PG_SERVICE" ]; then
    brew services start "$PG_SERVICE" 2>/dev/null
    sleep 2
    echo -e "${GREEN}✓ Started PostgreSQL ($PG_SERVICE)${NC}"
  else
    # Try starting any available postgres
    PG_SERVICE=$(brew services list 2>/dev/null | grep -i postgres | head -1 | awk '{print $1}')
    if [ -n "$PG_SERVICE" ]; then
      brew services start "$PG_SERVICE" 2>/dev/null
      sleep 2
      echo -e "${GREEN}✓ Started PostgreSQL ($PG_SERVICE)${NC}"
    else
      echo -e "${RED}✗ PostgreSQL not found. Install with: brew install postgresql@14${NC}"
      exit 1
    fi
  fi
fi

# Step 3: Create database if it doesn't exist
echo -e "\n${YELLOW}→ Ensuring database exists...${NC}"
if ! psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw nonprofit_connect; then
  createdb nonprofit_connect 2>/dev/null || true
  echo -e "  Created database 'nonprofit_connect'"
else
  echo -e "  Database 'nonprofit_connect' already exists"
fi
echo -e "${GREEN}✓ Database ready${NC}"

# Step 4: Install dependencies
echo -e "\n${YELLOW}→ Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo -e "  Installing npm packages..."
  npm install --silent
fi
echo -e "${GREEN}✓ Dependencies ready${NC}"

# Step 5: Push database schema
echo -e "\n${YELLOW}→ Pushing database schema...${NC}"
npx drizzle-kit push 2>&1 | tail -3
echo -e "${GREEN}✓ Database schema updated${NC}"

# Step 6: Seed database
echo -e "\n${YELLOW}→ Seeding database...${NC}"
npx tsx server/seed.ts
echo -e "${GREEN}✓ Database seeded${NC}"

# Step 7: Start development server with hot reload
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}  Application starting!${NC}"
echo -e "${GREEN}  → http://localhost:${APP_PORT}${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\n${YELLOW}Demo accounts (password: Password1!):${NC}"
echo -e "  Applicant:  alice@example.com"
echo -e "  Reviewer:   david@example.com"
echo -e "  Investor:   frank@example.com"
echo -e "  All roles:  noah@example.com"
echo -e "\n${YELLOW}Hot reload enabled - editing files will auto-refresh.${NC}\n"

# Start with tsx --watch for server hot reload (Vite handles client HMR)
exec npx tsx --watch server/index.ts
