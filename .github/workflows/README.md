# ShelfX CI/CD Pipeline Documentation

This directory contains GitHub Actions workflow configurations for continuous integration and deployment of the ShelfX application.

## CI Pipeline Overview

The CI pipeline (`ci.yml`) automates testing, building, and deploying the ShelfX application. It runs on pushes to the dev branch and pull requests.

### Pipeline Stages

1. **Build and Test**
   - Sets up Node.js environment
   - Installs dependencies
   - Lints code
   - Builds the frontend application
   - Runs tests (when configured)
   - Uses MySQL and Redis services for integration testing

2. **Docker Image Building**
   - Builds Docker images for both frontend and backend
   - Pushes images to DockerHub (when pushing to the dev branch)

3. **Deployment** (commented out, ready for future configuration)
   - Template for deployment steps when ready

## Required Secrets

To use this pipeline, you need to configure the following secrets in your GitHub repository:

- `DOCKER_USERNAME`: Your DockerHub username
- `DOCKER_PASSWORD`: Your DockerHub password or access token

## Local Development vs CI Environment

The CI pipeline uses:
- Node.js 18.x
- MySQL 8.0
- Redis Alpine

Ensure your local development environment matches these versions for consistency.

## Adding Tests

When you add tests to your project:
1. Uncomment the test command in the workflow file
2. Replace the placeholder with your actual test command

## Customizing the Pipeline

You can customize the pipeline by:
- Adding more test environments in the matrix
- Configuring deployment steps
- Adding code coverage reporting
- Setting up notifications

## Troubleshooting

If the pipeline fails:
1. Check the GitHub Actions logs
2. Verify your secrets are correctly configured
3. Ensure your code passes all tests locally before pushing