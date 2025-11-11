#!/bin/bash

# EC2 LaTeX Service Deployment Script
# This script pulls the Docker image from GitHub Container Registry and runs it on EC2
# Note: The image is automatically built and pushed by GitHub Actions when code is pushed to the repository

set -e

echo "🚀 Starting LaTeX Service Deployment to EC2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Installation guide: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if required files exist
if [ ! -f "docker-compose.latex.yml" ]; then
    echo -e "${RED}Error: docker-compose.latex.yml not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Required files found${NC}"

# Configuration - Set DOCKER_IMAGE_NAME environment variable or modify here
# For GitHub Container Registry: ghcr.io/username/repo-name/latex-service:latest
# For Docker Hub: username/resume-advisor-latex:latest
DOCKER_IMAGE_NAME="${DOCKER_IMAGE_NAME:-ghcr.io/your-username/resume-advisor-next/latex-service:latest}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Docker Image: $DOCKER_IMAGE_NAME"
echo ""

# Check if image is from GitHub Container Registry
if [[ "$DOCKER_IMAGE_NAME" == ghcr.io/* ]]; then
    echo -e "${YELLOW}Detected GitHub Container Registry image${NC}"
    echo "If the image is private, make sure you are logged in:"
    echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
    echo ""
fi

# Export for docker-compose
export DOCKER_IMAGE_NAME

# Stop existing service if running
echo -e "${YELLOW}Stopping existing LaTeX service (if running)...${NC}"
$DOCKER_COMPOSE -f docker-compose.latex.yml down 2>/dev/null || true

# Pull latest code (if using git) - only needed for docker-compose.yml file
if [ -d ".git" ]; then
    echo -e "${YELLOW}Pulling latest code...${NC}"
    git pull || echo -e "${YELLOW}Warning: Could not pull latest code${NC}"
fi

# Pull the Docker image
REGISTRY_TYPE="Docker Hub"
if [[ "$DOCKER_IMAGE_NAME" == ghcr.io/* ]]; then
    REGISTRY_TYPE="GitHub Container Registry"
fi

echo -e "${YELLOW}Pulling LaTeX service image from $REGISTRY_TYPE...${NC}"
docker pull "$DOCKER_IMAGE_NAME" || {
    echo -e "${RED}Failed to pull image from $REGISTRY_TYPE${NC}"
    echo "Make sure:"
    if [[ "$DOCKER_IMAGE_NAME" == ghcr.io/* ]]; then
        echo "  1. The image exists on GitHub Container Registry"
        echo "  2. You have access to the image (if private)"
        echo "  3. You are logged in: echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
    else
        echo "  1. The image exists on Docker Hub"
        echo "  2. You have access to the image (if private)"
        echo "  3. You are logged in: docker login"
    fi
    exit 1
}

# Start the service
echo -e "${YELLOW}Starting LaTeX service...${NC}"
$DOCKER_COMPOSE -f docker-compose.latex.yml up -d

# Wait for service to be healthy
echo -e "${YELLOW}Waiting for service to be healthy...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -f http://localhost:3002/health &> /dev/null; then
        echo -e "${GREEN}✓ LaTeX service is healthy!${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -e "${YELLOW}Waiting... (${ATTEMPT}/${MAX_ATTEMPTS})${NC}"
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}✗ Service failed to become healthy${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    $DOCKER_COMPOSE -f docker-compose.latex.yml logs --tail=50
    exit 1
fi

# Show service status
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
echo "Service Information:"
echo "  - Service URL: http://localhost:3002"
echo "  - Health Check: http://localhost:3002/health"
echo ""
echo "Useful commands:"
echo "  - View logs: $DOCKER_COMPOSE -f docker-compose.latex.yml logs -f"
echo "  - Stop service: $DOCKER_COMPOSE -f docker-compose.latex.yml down"
echo "  - Restart service: $DOCKER_COMPOSE -f docker-compose.latex.yml restart"
echo ""

# Get public IP if available
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "N/A")
if [ "$PUBLIC_IP" != "N/A" ]; then
    echo "EC2 Public IP: $PUBLIC_IP"
    echo "External Service URL: http://$PUBLIC_IP:3002"
    echo ""
    echo -e "${YELLOW}⚠️  Make sure your EC2 Security Group allows inbound traffic on port 3002${NC}"
fi

