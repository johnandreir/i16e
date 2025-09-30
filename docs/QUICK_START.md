# Quick Start Guide - Simplified Docker Setup

## 🚀 Super Simple Setup

### Option 1: Start Everything at Once (Recommended)

Just double-click: **`start-full-dev.bat`**

This will:

1. Start backend services in Docker (MongoDB, N8N, API)
2. Install all frontend dependencies automatically
3. Start the frontend development server with hot reload

### Option 2: Manual Step-by-Step

1. **Start Backend Services:**

   ```cmd
   docker-compose up -d
   ```

   - Wait about 30 seconds

2. **Start Frontend:**
   ```cmd
   npm install  # Only needed the first time
   npm run dev
   ```

## 🌐 Access Your Applications

- **Frontend (React App)**: http://localhost:8082
- **API Server**: http://localhost:3001
- **N8N Workflow**: http://localhost:5678
- **MongoDB**: localhost:27017

## 🛑 To Stop Everything

1. **Stop Frontend**: Press `Ctrl+C` in the terminal running `npm run dev`
2. **Stop Backend**: Double-click `stop.bat` or run `docker-compose down`

## 🔧 Utility Commands

- **`scripts/check-health.bat`** - Check if backend services are running
- **`scripts/view-logs.bat`** - View Docker service logs  
- **`scripts/cleanup.bat`** - Clean up Docker containers
- **`scripts/monitor-connection.bat`** - Monitor database connections
- **`scripts/restart-with-fixes.bat`** - Restart services with fixes

## 📦 What Gets Installed Automatically

When you run the setup, it automatically installs:

- **Backend**: Express, MongoDB driver, CORS (in Docker container)
- **Frontend**: React, Vite, TailwindCSS, TypeScript, and all UI components

## ✅ Dependencies Included

### Backend (Docker Container)

- Node.js 20
- Express.js
- MongoDB driver
- CORS middleware

### Frontend (Local Development)

- React 18
- TypeScript
- Vite (build tool)
- TailwindCSS
- Radix UI components
- React Router
- React Hook Form
- Recharts (for data visualization)
- All other UI dependencies

## 🎯 That's It!

Just run `start-full-dev.bat` and everything will be ready in under 2 minutes!
