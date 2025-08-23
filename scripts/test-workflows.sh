#!/bin/bash

# GitHub Actions Local Testing Script
# Run GitHub workflows locally using act

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo -e "${RED}❌ Act is not installed. Install it with: brew install act${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 GitHub Actions Local Testing${NC}"
echo -e "${BLUE}================================${NC}"

# Function to run a workflow
run_workflow() {
    local workflow_name=$1
    local workflow_file=$2
    local event=${3:-push}
    local job=${4:-""}
    
    echo -e "\n${YELLOW}🔄 Running: ${workflow_name}${NC}"
    
    if [ -n "$job" ]; then
        echo -e "${BLUE}Job: ${job}${NC}"
        act "$event" -W ".github/workflows/$workflow_file" -j "$job" --container-architecture linux/amd64
    else
        echo -e "${BLUE}All jobs in workflow${NC}"
        act "$event" -W ".github/workflows/$workflow_file" --container-architecture linux/amd64
    fi
}

# Show menu
show_menu() {
    echo -e "\n${GREEN}Available options:${NC}"
    echo "1. Run CI Pipeline (lint + test + build)"
    echo "2. Run Linting Only"
    echo "3. Run Unit Tests Only"
    echo "4. Run Build Only"
    echo "5. Run E2E Tests Only"
    echo "6. Run Security Audit Only"
    echo "7. Run Staging Deployment"
    echo "8. List all available workflows"
    echo "9. Dry run (show what would run)"
    echo "0. Exit"
}

# Main menu loop
while true; do
    show_menu
    echo -e "\n${BLUE}Choose an option (0-9):${NC} "
    read -r choice
    
    case $choice in
        1)
            run_workflow "CI Pipeline" "ci.yml" "push"
            ;;
        2)
            run_workflow "Linting" "ci.yml" "push" "lint-and-format"
            ;;
        3)
            run_workflow "Unit Tests" "ci.yml" "push" "test"
            ;;
        4)
            run_workflow "Build" "ci.yml" "push" "build"
            ;;
        5)
            run_workflow "E2E Tests" "ci.yml" "push" "e2e-tests"
            ;;
        6)
            run_workflow "Security Audit" "ci.yml" "push" "security-audit"
            ;;
        7)
            run_workflow "Staging Deployment" "deploy-staging.yml" "push"
            ;;
        8)
            echo -e "\n${YELLOW}📋 Available workflows:${NC}"
            act --list
            ;;
        9)
            echo -e "\n${YELLOW}🔍 Dry run - what would execute:${NC}"
            act push -n
            ;;
        0)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Please choose 0-9.${NC}"
            ;;
    esac
    
    echo -e "\n${GREEN}✅ Command completed. Press Enter to continue...${NC}"
    read -r
done
