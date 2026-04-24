#!/bin/bash

# =============================================================================
# AI Pathology Slide Analyzer - Startup Script
# =============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║    🔬 AI Pathology Slide Analyzer            ║"
echo "  ║    Digital Pathology Platform                 ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Load env vars
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found!${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# =============================================================================
# Clean up used ports
# =============================================================================
echo -e "\n${YELLOW}Cleaning up ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  echo -e "  ${GREEN}✓ Port $port is free${NC}"
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# =============================================================================
# Check PostgreSQL
# =============================================================================
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if command -v pg_isready &>/dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &>/dev/null; then
    echo -e "  ${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &>/dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
  fi
else
  echo -e "  ${YELLOW}⚠ pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# =============================================================================
# Create database if not exists
# =============================================================================
echo -e "\n${YELLOW}Setting up database...${NC}"
DB_NAME=${DB_NAME:-pathology_analyzer}

if psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  ${GREEN}✓ Database '$DB_NAME' exists${NC}"
else
  echo -e "  Creating database '$DB_NAME'..."
  createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} "$DB_NAME" 2>/dev/null || \
  psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo -e "  ${GREEN}✓ Database created${NC}"
fi

# =============================================================================
# Install dependencies
# =============================================================================
echo -e "\n${YELLOW}Installing backend dependencies...${NC}"
cd "$ROOT_DIR/backend"
if [ ! -d "node_modules" ]; then
  npm install --silent 2>&1 | tail -1
else
  echo -e "  ${GREEN}✓ Backend dependencies already installed${NC}"
fi

echo -e "\n${YELLOW}Installing frontend dependencies...${NC}"
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  npm install --silent 2>&1 | tail -1
else
  echo -e "  ${GREEN}✓ Frontend dependencies already installed${NC}"
fi

cd "$ROOT_DIR"

# =============================================================================
# Seed database
# =============================================================================
echo -e "\n${YELLOW}Seeding database...${NC}"
cd "$ROOT_DIR/backend"
node src/seed.js
echo -e "${GREEN}✓ Database seeded successfully${NC}"

# =============================================================================
# Start backend with hot reload (nodemon)
# =============================================================================
echo -e "\n${YELLOW}Starting backend server (port $BACKEND_PORT) with hot reload...${NC}"
cd "$ROOT_DIR/backend"
npx nodemon src/server.js &
BACKEND_PID=$!
echo -e "  ${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
sleep 2

# =============================================================================
# Start frontend with hot reload (react-scripts)
# =============================================================================
echo -e "\n${YELLOW}Starting frontend (port $FRONTEND_PORT) with hot reload...${NC}"
cd "$ROOT_DIR/frontend"
PORT=$FRONTEND_PORT BROWSER=none npm start &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# =============================================================================
# Cleanup on exit
# =============================================================================
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  echo -e "${GREEN}✓ All processes stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 Application is running!                   ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  Frontend: http://localhost:$FRONTEND_PORT             ║${NC}"
echo -e "${GREEN}║  Backend:  http://localhost:$BACKEND_PORT             ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  Login: admin@pathlab.com / password123        ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"

# Keep script running
wait
