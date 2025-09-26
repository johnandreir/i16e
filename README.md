# DevOps Insight Engine

AI-Powered Performance Analytics Platform for DevOps Teams

## Overview

The DevOps Insight Engine is a comprehensive analytics platform that provides real-time insights into team performance, customer satisfaction, and operational metrics. Built with modern web technologies and featuring an integrated AI chatbot for intelligent data analysis.

## Key Features

- **Performance Dashboard**: Real-time team performance metrics and KPIs
- **Survey Analysis**: Customer satisfaction tracking and analysis
- **AI Chatbot Integration**: N8N-powered intelligent assistant with MongoDB memory
- **Dark/Light Theme Support**: Responsive design with theme switching
- **Data Visualization**: Interactive charts and graphs using Recharts
- **Docker Containerization**: Full containerized deployment with MongoDB, N8N, and API services

## Architecture

The platform consists of:

- **Frontend**: React/TypeScript dashboard with shadcn/ui components
- **Backend API**: Node.js MongoDB API server
- **Database**: MongoDB for data storage and chat memory
- **AI Workflow**: N8N automation platform with OpenAI integration
- **Containerization**: Docker Compose orchestration

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm (for local development)
- Git

### Using Docker (Recommended)

```sh
# Clone the repository
git clone https://github.com/johnandreir/devops-insight-engine.git

# Navigate to project directory
cd devops-insight-engine

# Start all services with Docker Compose
docker-compose up -d

# Access the services:
# - Dashboard: http://localhost:8082
# - N8N Workflow: http://localhost:5678
# - MongoDB API: http://localhost:3001
# - MongoDB: localhost:27017
```

### Local Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev
# or
node start-dev.js

# Start with monitoring
npm run start:monitor
```

### Development Scripts

```sh
# Start development with API integration
node start-dev-with-api.js

# Start with enhanced monitoring
node start-dev-enhanced.js

# Start isolated API server
npm run start:api
```

## Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend & Infrastructure

- **Node.js** API server
- **MongoDB** database with authentication
- **N8N** automation and workflow platform
- **OpenAI GPT-4.1-mini** for AI chatbot
- **Docker & Docker Compose** for containerization

### Development Tools

- **ESLint** for code linting
- **TypeScript** for type safety
- **PostCSS** for CSS processing
- **PowerShell** scripts for Windows automation

## Services Architecture

| Service               | Port  | Description                  |
| --------------------- | ----- | ---------------------------- |
| Frontend Dashboard    | 8082  | React TypeScript application |
| N8N Workflow Platform | 5678  | AI chatbot and automation    |
| MongoDB API           | 3001  | RESTful API server           |
| MongoDB Database      | 27017 | Primary data storage         |

## Environment Configuration

### MongoDB Credentials

- Username: `admin`
- Password: `N0virus1!`
- Database: `i16e-db`
- N8N Database: `n8n`

### Docker Network

- Network: `i16e-network`
- Subnet: `172.20.0.0/16`

## Features

### Dashboard Components

- **Team Performance Charts**: Real-time SCT scores and case metrics
- **Survey Analysis**: Customer satisfaction pie charts and trends
- **Performance Overview**: Multi-metric bar charts with theme-aware styling
- **AI Chatbot**: Integrated N8N-powered assistant with persistent memory

### AI Chatbot Capabilities

- **Natural Language Processing**: GPT-4.1-mini powered responses
- **Persistent Memory**: MongoDB-based conversation history
- **Dashboard Integration**: Seamless UI/UX matching dashboard theme
- **Custom Styling**: Theme-aware colors and typography

## Development

### Project Structure

```
devops-insight-engine/
├── src/
│   ├── components/          # React components
│   │   └── dashboard/       # Dashboard-specific components
│   ├── lib/                 # Utility libraries
│   └── pages/              # Application pages
├── docker-compose.yml       # Container orchestration
├── Dockerfile.api          # API service container
├── Chatbot.json           # N8N workflow configuration
└── package.json           # Node.js dependencies
```

### Key Scripts

- `start-dev.js` - Development server with hot reload
- `start-dev-enhanced.js` - Development with monitoring
- `mongodb-api-server.cjs` - Standalone API server
- `service-monitor.ps1` - Windows service monitoring

## Deployment

### Production Deployment

```sh
# Build and deploy with Docker
docker-compose up -d --build

# Check service health
docker-compose ps
docker-compose logs
```

### Development Deployment

```sh
# Start development environment
npm run dev

# Or with enhanced monitoring
node start-dev-enhanced.js
```

## Monitoring & Health Checks

All services include health checks:

- **MongoDB**: Connection ping tests
- **N8N**: HTTP health endpoint monitoring
- **API**: RESTful health endpoint
- **Frontend**: Development server status

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "Add new feature"`
4. Push to branch: `git push origin feature/new-feature`
5. Create a Pull Request

## Repository

**GitHub**: [https://github.com/johnandreir/devops-insight-engine](https://github.com/johnandreir/devops-insight-engine)

## License

This project is proprietary software developed for DevOps performance analytics.

---

_Last updated: September 26, 2025_
