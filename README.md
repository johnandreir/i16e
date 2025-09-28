# DevOps Insight Engine

AI-Powered Performance Analytics Platform for DevOps Teams

## Overview

The DevOps Insight Engine is a comprehensive analytics platform that provides real-time insights into team performance, customer satisfaction, and operational metrics. Built with modern web technologies and featuring an integrated AI chatbot for intelligent data analysis.

## Project Structure

The project has been reorganized for better maintainability:

- **`/docker`** - Docker configuration files
- **`/docs`** - Documentation files
- **`/mongodb-init`** - MongoDB initialization scripts
- **`/n8n-workflows`** - n8n workflow definitions
- **`/scripts`** - Operational scripts
- **`/server`** - API server code
- **`/src`** - Frontend source code
- **`/utils`** - Utility scripts

For detailed information about the project structure, see [Project Structure Documentation](docs/PROJECT_STRUCTURE.md).

## Key Features

- **Performance Dashboard**: Real-time team performance metrics and KPIs
- **Survey Analysis**: Customer satisfaction tracking and analysis
- **AI Chatbot Integration**: N8N-powered intelligent assistant with MongoDB memory
- **Dark/Light Theme Support**: Responsive design with theme switching
- **Data Visualization**: Interactive charts and graphs using Recharts
- **Hybrid Architecture**: Docker backend services with local frontend development

## Architecture

The platform consists of:

- **Frontend**: React/TypeScript dashboard with shadcn/ui components (runs locally)
- **Backend API**: Node.js MongoDB API server (Docker containerized)
- **Database**: MongoDB for data storage and chat memory (Docker containerized)
- **AI Workflow**: N8N automation platform with OpenAI integration (Docker containerized)
- **Development Environment**: Hot reload frontend with containerized backend services
- **Deployment**: Single docker-compose setup for easy deployment and development

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Git

### Starting the Application

1. Start the backend services using Docker:

   ```
   docker-compose up -d
   ```

2. Install frontend dependencies:

   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```

Alternatively, you can use the `start-full-dev.bat` script to start everything at once.

### Accessing the Application

- Frontend: http://localhost:8082
- API Server: http://localhost:3001
- N8N: http://localhost:5678

### Super Quick Setup (Recommended)

```sh
# Clone the repository
git clone https://github.com/johnandreir/devops-insight-engine.git
cd devops-insight-engine

# Windows: Start everything with one command
start-full-dev.bat

# Or manually:
# 1. Start backend services (Docker)
docker-compose -f docker-compose.prod.yml up -d

# 2. Start frontend development server
npm run dev
```

**That's it!** 🎉 Everything will be running in under 2 minutes.

### 🌐 Access Your Applications

- **Frontend Dashboard**: http://localhost:8082 (React dev server with hot reload)
- **Backend API**: http://localhost:3001 (MongoDB API endpoints)
- **N8N Workflow**: http://localhost:5678 (AI chatbot and automation)
- **MongoDB**: localhost:27017 (Database server)

### 🛠️ Windows Batch Commands

For Windows users, convenient batch files are provided:

- **`start-full-dev.bat`** - Start everything (backend + frontend) in one command
- **`start-prod.bat`** - Start only backend services (MongoDB, N8N, API)
- **`stop-prod.bat`** - Stop backend services
- **`check-health.bat`** - Check service health status
- **`view-logs.bat`** - View Docker service logs
- **`cleanup.bat`** - Clean up Docker containers and images

### 🐧 Linux/Mac Commands

```sh
# Start backend services only
docker-compose -f docker-compose.prod.yml up -d

# Start frontend development server
npm run dev

# Stop backend services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Local Development

```sh
# Install all dependencies
npm install

# Start frontend development server (with hot reload)
npm run dev

# Start backend API server locally (alternative to Docker)
npm run api
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

| Service               | Port  | Description                  | Environment      |
| --------------------- | ----- | ---------------------------- | ---------------- |
| Frontend Dashboard    | 8082  | React TypeScript application | Local Dev Server |
| MongoDB API           | 3001  | RESTful API server           | Docker Container |
| N8N Workflow Platform | 5678  | AI chatbot and automation    | Docker Container |
| MongoDB Database      | 27017 | Primary data storage         | Docker Container |

## 🚀 Why This Architecture?

### ✅ **Hybrid Approach Benefits:**

- **Fast Development**: Frontend hot reload without Docker rebuilds
- **Quick Setup**: Backend services start in ~30 seconds (not 500+ seconds)
- **Production Ready**: Backend services containerized for consistency
- **Developer Friendly**: All dependencies auto-installed with `npm install`

### 🔄 **Development Workflow:**

1. **Backend Services** run in Docker containers (isolated, consistent)
2. **Frontend** runs locally with Vite dev server (fast hot reload)
3. **Database** persists data in Docker volumes
4. **Dependencies** automatically managed by npm and Docker

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
│   │   ├── dashboard/       # Dashboard-specific components
│   │   └── ui/             # Reusable UI components (shadcn/ui)
│   ├── lib/                # Utility libraries
│   ├── hooks/              # Custom React hooks
│   └── pages/              # Application pages
├── docker-compose.prod.yml  # Production backend services
├── docker-compose.dev.yml   # Development backend services
├── Dockerfile.api          # API service container
├── mongodb-api-server.cjs   # Express.js API server
├── start-full-dev.bat      # Windows: Start everything
├── start-prod.bat          # Windows: Start backend only
├── QUICK_START.md          # Simple setup instructions
└── package.json           # Frontend dependencies
```

### Key Files

- **`mongodb-api-server.cjs`** - Express.js API server with MongoDB integration
- **`start-full-dev.bat`** - One-command setup for Windows
- **`docker-compose.prod.yml`** - Backend services orchestration
- **`package.json`** - All frontend dependencies (React, Vite, TypeScript, etc.)
- **`QUICK_START.md`** - Simplified development guide

## Deployment

### Development Deployment (Recommended)

```sh
# Windows (One Command)
start-full-dev.bat

# Manual Steps
docker-compose -f docker-compose.prod.yml up -d  # Backend services
npm run dev                                        # Frontend server
```

### Production Deployment

```sh
# Build and deploy backend services
docker-compose -f docker-compose.prod.yml up -d --build

# Build frontend for production
npm run build

# Serve built frontend (example with serve)
npm install -g serve
serve -s dist -l 8082
```

### Health Monitoring

```sh
# Check all backend services
docker ps
docker-compose -f docker-compose.prod.yml logs

# Windows health check
check-health.bat

# Manual endpoint checks
curl http://localhost:3001/api/health  # API health
curl http://localhost:5678/healthz     # N8N health
```

## Troubleshooting

### Common Issues

**Docker services won't start:**

```sh
# Clean up and restart
cleanup.bat                    # Windows
docker system prune -f         # Manual cleanup
docker-compose -f docker-compose.prod.yml up -d --build
```

**Frontend won't start:**

```sh
# Reinstall dependencies
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s node_modules & del package-lock.json  # Windows
npm install
npm run dev
```

**Port conflicts:**

```sh
# Check what's using ports
netstat -ano | findstr :8082   # Windows
lsof -i :8082                  # Mac/Linux

# Kill process if needed
taskkill /f /pid <PID>         # Windows
kill -9 <PID>                 # Mac/Linux
```

### Logs and Debugging

```sh
# View specific service logs
docker logs i16e-api           # API server logs
docker logs i16e-mongodb       # Database logs
docker logs i16e-n8n           # N8N workflow logs

# Windows batch helper
view-logs.bat                  # Interactive log viewer
```

## Monitoring & Health Checks

All backend services include automated health checks:

- **MongoDB**: Database connection ping tests
- **N8N**: HTTP health endpoint monitoring (`/healthz`)
- **API**: RESTful health endpoint (`/api/health`)
- **Frontend**: Development server auto-reload on file changes

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

## 📖 Additional Documentation

- **[QUICK_START.md](QUICK_START.md)** - Simplified setup guide
- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Detailed Docker instructions
- **[PERFORMANCE_DATA_AGGREGATION.md](PERFORMANCE_DATA_AGGREGATION.md)** - Data architecture guide

_Last updated: September 27, 2025 - Simplified Docker architecture with hybrid development approach_
