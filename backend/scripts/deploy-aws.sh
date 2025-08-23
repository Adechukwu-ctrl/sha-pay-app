#!/bin/bash

# AWS ECS Deployment Script for Sha Pay Backend
# Usage: ./scripts/deploy-aws.sh [region] [cluster-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION=${1:-us-east-1}
CLUSTER_NAME=${2:-sha-pay-cluster}
SERVICE_NAME="sha-pay-backend-service"
TASK_FAMILY="sha-pay-backend"
REPO_NAME="sha-pay-backend"
IMAGE_TAG="latest"

echo -e "${BLUE}🚀 Starting AWS ECS deployment...${NC}"
echo -e "${BLUE}📍 Region: ${REGION}${NC}"
echo -e "${BLUE}🏗️  Cluster: ${CLUSTER_NAME}${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo -e "${YELLOW}Visit: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to get AWS account ID. Please check your AWS credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS Account ID: ${ACCOUNT_ID}${NC}"

# Create ECR repository if it doesn't exist
echo -e "${BLUE}🗄️  Creating ECR repository...${NC}"
aws ecr describe-repositories --repository-names ${REPO_NAME} --region ${REGION} &> /dev/null || \
aws ecr create-repository --repository-name ${REPO_NAME} --region ${REGION}

# Get ECR login token
echo -e "${BLUE}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Build and tag Docker image
echo -e "${BLUE}🏗️  Building Docker image...${NC}"
docker build -t ${REPO_NAME}:${IMAGE_TAG} .
docker tag ${REPO_NAME}:${IMAGE_TAG} ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:${IMAGE_TAG}

# Push image to ECR
echo -e "${BLUE}📤 Pushing image to ECR...${NC}"
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}:${IMAGE_TAG}

# Create ECS cluster if it doesn't exist
echo -e "${BLUE}🏗️  Creating ECS cluster...${NC}"
aws ecs describe-clusters --clusters ${CLUSTER_NAME} --region ${REGION} &> /dev/null || \
aws ecs create-cluster --cluster-name ${CLUSTER_NAME} --capacity-providers FARGATE --region ${REGION}

# Create CloudWatch log group
echo -e "${BLUE}📋 Creating CloudWatch log group...${NC}"
aws logs create-log-group --log-group-name "/ecs/${TASK_FAMILY}" --region ${REGION} 2>/dev/null || true

# Update task definition with actual values
echo -e "${BLUE}📝 Updating task definition...${NC}"
sed -i.bak "s/YOUR_ACCOUNT_ID/${ACCOUNT_ID}/g" aws-task-definition.json
sed -i.bak "s/YOUR_REGION/${REGION}/g" aws-task-definition.json

# Register task definition
echo -e "${BLUE}📋 Registering task definition...${NC}"
TASK_DEFINITION_ARN=$(aws ecs register-task-definition --cli-input-json file://aws-task-definition.json --region ${REGION} --query 'taskDefinition.taskDefinitionArn' --output text)

echo -e "${GREEN}✅ Task definition registered: ${TASK_DEFINITION_ARN}${NC}"

# Create or update ECS service
echo -e "${BLUE}🚀 Creating/updating ECS service...${NC}"
if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION} &> /dev/null; then
    # Update existing service
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${SERVICE_NAME} \
        --task-definition ${TASK_DEFINITION_ARN} \
        --region ${REGION}
else
    # Create new service
    aws ecs create-service \
        --cluster ${CLUSTER_NAME} \
        --service-name ${SERVICE_NAME} \
        --task-definition ${TASK_DEFINITION_ARN} \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" \
        --region ${REGION}
fi

# Wait for service to be stable
echo -e "${BLUE}⏳ Waiting for service to be stable...${NC}"
aws ecs wait services-stable --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION}

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Service details:${NC}"
aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${REGION} --query 'services[0].{Status:status,RunningCount:runningCount,PendingCount:pendingCount}'

echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo -e "${YELLOW}1. Configure your VPC, subnets, and security groups${NC}"
echo -e "${YELLOW}2. Set up Application Load Balancer for external access${NC}"
echo -e "${YELLOW}3. Configure AWS Secrets Manager with your environment variables${NC}"
echo -e "${YELLOW}4. Set up RDS for your database${NC}"