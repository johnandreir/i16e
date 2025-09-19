const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = 3001;

// MongoDB connection configuration with robust settings
const MONGODB_URI = 'mongodb://root:novirus@localhost:27017/devops-insight-engine?authSource=admin';
let db;
let client;
let isConnected = false;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 5000; // 5 seconds
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
let healthCheckTimer = null;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced MongoDB connection with retry logic and connection pooling
async function connectToMongoDB(retryAttempt = 0) {
  try {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.log('Previous client cleanup completed');
      }
    }

    console.log(`🔄 Attempting MongoDB connection (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})...`);
    
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 300000, // 5 minutes
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds
      heartbeatFrequencyMS: 10000, // 10 seconds
      retryWrites: true,
      retryReads: true,
      compressors: ['zlib'],
      zlibCompressionLevel: 6
    });

    await client.connect();
    
    // Verify connection with ping
    await client.db('admin').command({ ping: 1 });
    
    db = client.db('devops-insight-engine');
    isConnected = true;
    connectionRetryCount = 0;
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Connection pool size: ${client.options.maxPoolSize}`);
    
    // Setup connection event listeners
    setupConnectionListeners();
    
    // Start health check monitoring
    startHealthCheckMonitoring();
    
    return true;
  } catch (error) {
    isConnected = false;
    connectionRetryCount++;
    console.error(`❌ MongoDB connection failed (attempt ${retryAttempt + 1}):`, error.message);
    
    if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
      console.log(`🔄 Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
      setTimeout(() => {
        connectToMongoDB(retryAttempt + 1);
      }, RETRY_DELAY);
    } else {
      console.log('❌ Maximum connection retry attempts reached');
      console.log('📡 API server will continue without MongoDB - using fallback data');
    }
    return false;
  }
}

// Setup MongoDB connection event listeners
function setupConnectionListeners() {
  if (!client) return;

  client.on('connectionPoolCreated', () => {
    console.log('🏊 MongoDB connection pool created');
  });

  client.on('connectionPoolClosed', () => {
    console.log('🏊 MongoDB connection pool closed');
    isConnected = false;
  });

  client.on('connectionCreated', () => {
    console.log('🔗 New MongoDB connection established');
  });

  client.on('connectionClosed', () => {
    console.log('🔗 MongoDB connection closed');
  });

  client.on('serverHeartbeatFailed', (event) => {
    console.error('💓 MongoDB heartbeat failed:', event.failure.message);
    isConnected = false;
    attemptReconnection();
  });

  client.on('topologyDescriptionChanged', (event) => {
    const { newDescription } = event;
    if (newDescription.type === 'Unknown') {
      console.warn('⚠️ MongoDB topology became unknown, may need reconnection');
      isConnected = false;
    }
  });
}

// Health check monitoring
function startHealthCheckMonitoring() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
  }

  healthCheckTimer = setInterval(async () => {
    try {
      if (client && isConnected) {
        await client.db('admin').command({ ping: 1 });
        if (!isConnected) {
          console.log('✅ MongoDB connection restored');
          isConnected = true;
        }
      }
    } catch (error) {
      console.error('💓 Health check failed:', error.message);
      isConnected = false;
      attemptReconnection();
    }
  }, HEALTH_CHECK_INTERVAL);
}

// Attempt reconnection when connection is lost
async function attemptReconnection() {
  if (connectionRetryCount < MAX_RETRY_ATTEMPTS) {
    console.log('🔄 Attempting to reconnect to MongoDB...');
    await connectToMongoDB(connectionRetryCount);
  }
}

// Enhanced health check endpoint with comprehensive status
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'ok',
      message: 'API server is running',
      timestamp: new Date().toISOString(),
      mongodb: {
        connected: isConnected,
        connectionRetries: connectionRetryCount,
        hasClient: !!client
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      }
    };

    // Test MongoDB connection if available
    if (client && isConnected) {
      try {
        await client.db('admin').command({ ping: 1 });
        healthStatus.mongodb.ping = 'success';
        healthStatus.mongodb.lastPing = new Date().toISOString();
      } catch (pingError) {
        healthStatus.mongodb.ping = 'failed';
        healthStatus.mongodb.pingError = pingError.message;
        isConnected = false;
      }
    }

    const statusCode = isConnected ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced database operation wrapper with retry logic
async function performDatabaseOperation(operation, collectionName, operationName) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      if (!isConnected || !db) {
        throw new Error('Database not connected');
      }

      const result = await operation(db.collection(collectionName));
      return { success: true, data: result };
    } catch (error) {
      retryCount++;
      console.error(`❌ Database operation failed (${operationName}, attempt ${retryCount}):`, error.message);

      if (error.message.includes('topology') || error.message.includes('connection') || error.message.includes('network')) {
        isConnected = false;
        attemptReconnection();
      }

      if (retryCount >= maxRetries) {
        return { success: false, error: error.message, fallback: true };
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
}

// Cases endpoints with robust error handling
app.get('/api/cases', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, returning empty cases array');
      return res.json([]);
    }
    
    const operation = async (collection) => {
      return await collection.find({}).toArray();
    };

    const result = await performDatabaseOperation(operation, 'cases', 'fetch cases');
    
    if (!result.success) {
      console.error('Failed to fetch cases:', result.error);
      return res.status(503).json({ error: 'Failed to fetch cases', fallback: true, data: [] });
    }

    const formattedCases = result.data.map(caseItem => ({
      case_id: caseItem.case_id,
      priority: caseItem.priority,
      owner_full_name: caseItem.owner_full_name,
      title: caseItem.title,
      products: caseItem.products || [],
      status: caseItem.status,
      created_date: caseItem.created_date,
      closed_date: caseItem.closed_date,
      case_age_days: caseItem.case_age_days,
      structured_email_thread: caseItem.structured_email_thread
    }));
    
    res.json(formattedCases);
  } catch (error) {
    console.error('❌ Error in /api/cases endpoint:', error);
    res.status(500).json({ error: 'Internal server error', fallback: true, data: [] });
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, cannot create case');
      return res.status(503).json({ error: 'Database not available', fallback: true });
    }

    const { case_id, priority, owner_full_name, title, products, status, created_date, closed_date, case_age_days, structured_email_thread } = req.body;
    
    // Validate required fields
    if (!case_id || !title || !status) {
      return res.status(400).json({ error: 'Missing required fields: case_id, title, status' });
    }
    
    const now = new Date();
    const caseData = {
      case_id,
      priority,
      owner_full_name,
      title,
      products: products || [],
      status,
      created_date: created_date ? new Date(created_date) : now,
      closed_date: closed_date ? new Date(closed_date) : undefined,
      case_age_days,
      structured_email_thread,
      created_at: now,
      updated_at: now
    };

    const insertOperation = async (collection) => {
      return await collection.insertOne(caseData);
    };

    const insertResult = await performDatabaseOperation(insertOperation, 'cases', 'insert case');
    
    if (!insertResult.success) {
      console.error('Failed to create case:', insertResult.error);
      return res.status(503).json({ error: 'Failed to create case', fallback: true });
    }

    const findOperation = async (collection) => {
      return await collection.findOne({ _id: insertResult.data.insertedId });
    };

    const findResult = await performDatabaseOperation(findOperation, 'cases', 'find created case');
    
    if (!findResult.success) {
      // Return the data we attempted to insert
      console.warn('Case created but could not retrieve:', findResult.error);
      return res.json({
        case_id: caseData.case_id,
        priority: caseData.priority,
        owner_full_name: caseData.owner_full_name,
        title: caseData.title,
        products: caseData.products,
        status: caseData.status,
        created_date: caseData.created_date,
        closed_date: caseData.closed_date,
        case_age_days: caseData.case_age_days,
        structured_email_thread: caseData.structured_email_thread
      });
    }

    const caseItem = findResult.data;
    res.json({
      case_id: caseItem.case_id,
      priority: caseItem.priority,
      owner_full_name: caseItem.owner_full_name,
      title: caseItem.title,
      products: caseItem.products || [],
      status: caseItem.status,
      created_date: caseItem.created_date,
      closed_date: caseItem.closed_date,
      case_age_days: caseItem.case_age_days,
      structured_email_thread: caseItem.structured_email_thread
    });
  } catch (error) {
    console.error('❌ Error creating case:', error);
    res.status(500).json({ error: 'Internal server error', fallback: true });
  }
});

// Teams endpoints with robust error handling
app.get('/api/teams', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, returning empty teams array');
      return res.json([]);
    }
    
    const operation = async (collection) => {
      return await collection.find({}).toArray();
    };

    const result = await performDatabaseOperation(operation, 'teams', 'fetch teams');
    
    if (!result.success) {
      console.error('Failed to fetch teams:', result.error);
      return res.status(503).json({ error: 'Failed to fetch teams', data: [] });
    }

    const formattedTeams = result.data.map(team => ({
      id: team._id.toString(),
      name: team.name,
      description: team.description,
      created_at: team.created_at ? team.created_at.toISOString() : new Date().toISOString(),
      updated_at: team.updated_at ? team.updated_at.toISOString() : new Date().toISOString()
    }));
    
    res.json(formattedTeams);
  } catch (error) {
    console.error('❌ Error in /api/teams endpoint:', error);
    res.status(500).json({ error: 'Internal server error', data: [] });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, cannot create team');
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    
    const now = new Date();
    const teamData = {
      name,
      description,
      created_at: now,
      updated_at: now
    };

    const insertOperation = async (collection) => {
      return await collection.insertOne(teamData);
    };

    const insertResult = await performDatabaseOperation(insertOperation, 'teams', 'insert team');
    
    if (!insertResult.success) {
      console.error('Failed to create team:', insertResult.error);
      return res.status(503).json({ error: 'Failed to create team' });
    }

    const findOperation = async (collection) => {
      return await collection.findOne({ _id: insertResult.data.insertedId });
    };

    const findResult = await performDatabaseOperation(findOperation, 'teams', 'find created team');
    
    if (!findResult.success) {
      console.warn('Team created but could not retrieve:', findResult.error);
      return res.json({
        id: insertResult.data.insertedId.toString(),
        name: teamData.name,
        description: teamData.description,
        created_at: teamData.created_at.toISOString(),
        updated_at: teamData.updated_at.toISOString()
      });
    }

    const team = findResult.data;
    res.json({
      id: team._id.toString(),
      name: team.name,
      description: team.description,
      created_at: team.created_at.toISOString(),
      updated_at: team.updated_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Squads endpoints with robust error handling
app.get('/api/squads', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, returning empty squads array');
      return res.json([]);
    }
    
    const operation = async (collection) => {
      return await collection.find({}).toArray();
    };

    const result = await performDatabaseOperation(operation, 'squads', 'fetch squads');
    
    if (!result.success) {
      console.error('Failed to fetch squads:', result.error);
      return res.status(503).json({ error: 'Failed to fetch squads', data: [] });
    }

    const formattedSquads = result.data.map(squad => ({
      id: squad._id.toString(),
      name: squad.name,
      team_id: squad.team_id ? squad.team_id.toString() : squad.team_id,
      description: squad.description,
      created_at: squad.created_at ? squad.created_at.toISOString() : new Date().toISOString(),
      updated_at: squad.updated_at ? squad.updated_at.toISOString() : new Date().toISOString()
    }));
    
    res.json(formattedSquads);
  } catch (error) {
    console.error('❌ Error in /api/squads endpoint:', error);
    res.status(500).json({ error: 'Internal server error', data: [] });
  }
});

app.post('/api/squads', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, cannot create squad');
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { name, team_id, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    
    const now = new Date();
    const squadData = {
      name,
      team_id,
      description,
      created_at: now,
      updated_at: now
    };

    const insertOperation = async (collection) => {
      return await collection.insertOne(squadData);
    };

    const insertResult = await performDatabaseOperation(insertOperation, 'squads', 'insert squad');
    
    if (!insertResult.success) {
      console.error('Failed to create squad:', insertResult.error);
      return res.status(503).json({ error: 'Failed to create squad' });
    }

    const findOperation = async (collection) => {
      return await collection.findOne({ _id: insertResult.data.insertedId });
    };

    const findResult = await performDatabaseOperation(findOperation, 'squads', 'find created squad');
    
    if (!findResult.success) {
      console.warn('Squad created but could not retrieve:', findResult.error);
      return res.json({
        id: insertResult.data.insertedId.toString(),
        name: squadData.name,
        team_id: squadData.team_id ? squadData.team_id.toString() : squadData.team_id,
        description: squadData.description,
        created_at: squadData.created_at.toISOString(),
        updated_at: squadData.updated_at.toISOString()
      });
    }

    const squad = findResult.data;
    res.json({
      id: squad._id.toString(),
      name: squad.name,
      team_id: squad.team_id ? squad.team_id.toString() : squad.team_id,
      description: squad.description,
      created_at: squad.created_at.toISOString(),
      updated_at: squad.updated_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating squad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DPEs endpoints with robust error handling
app.get('/api/dpes', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, returning empty dpes array');
      return res.json([]);
    }
    
    const operation = async (collection) => {
      return await collection.find({}).toArray();
    };

    const result = await performDatabaseOperation(operation, 'dpes', 'fetch dpes');
    
    if (!result.success) {
      console.error('Failed to fetch dpes:', result.error);
      return res.status(503).json({ error: 'Failed to fetch dpes', data: [] });
    }

    const formattedDPEs = result.data.map(dpe => ({
      id: dpe._id.toString(),
      name: dpe.name,
      squad_id: dpe.squad_id ? dpe.squad_id.toString() : dpe.squad_id,
      email: dpe.email,
      created_at: dpe.created_at ? dpe.created_at.toISOString() : new Date().toISOString(),
      updated_at: dpe.updated_at ? dpe.updated_at.toISOString() : new Date().toISOString()
    }));
    
    res.json(formattedDPEs);
  } catch (error) {
    console.error('❌ Error in /api/dpes endpoint:', error);
    res.status(500).json({ error: 'Internal server error', data: [] });
  }
});

app.post('/api/dpes', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, cannot create dpe');
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { name, squad_id, email } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Missing required fields: name, email' });
    }
    
    const now = new Date();
    const dpeData = {
      name,
      squad_id,
      email,
      created_at: now,
      updated_at: now
    };

    const insertOperation = async (collection) => {
      return await collection.insertOne(dpeData);
    };

    const insertResult = await performDatabaseOperation(insertOperation, 'dpes', 'insert dpe');
    
    if (!insertResult.success) {
      console.error('Failed to create dpe:', insertResult.error);
      return res.status(503).json({ error: 'Failed to create dpe' });
    }

    const findOperation = async (collection) => {
      return await collection.findOne({ _id: insertResult.data.insertedId });
    };

    const findResult = await performDatabaseOperation(findOperation, 'dpes', 'find created dpe');
    
    if (!findResult.success) {
      console.warn('DPE created but could not retrieve:', findResult.error);
      return res.json({
        id: insertResult.data.insertedId.toString(),
        name: dpeData.name,
        squad_id: dpeData.squad_id ? dpeData.squad_id.toString() : dpeData.squad_id,
        email: dpeData.email,
        created_at: dpeData.created_at.toISOString(),
        updated_at: dpeData.updated_at.toISOString()
      });
    }

    const dpe = findResult.data;
    res.json({
      id: dpe._id.toString(),
      name: dpe.name,
      squad_id: dpe.squad_id ? dpe.squad_id.toString() : dpe.squad_id,
      email: dpe.email,
      created_at: dpe.created_at.toISOString(),
      updated_at: dpe.updated_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating dpe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
let server = null;

// Enhanced graceful shutdown handler
function setupGracefulShutdown() {
  const cleanup = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down MongoDB API server gracefully...`);
    
    // Stop health check monitoring
    if (healthCheckTimer) {
      console.log('⏹️ Stopping health check monitoring...');
      clearInterval(healthCheckTimer);
      healthCheckTimer = null;
    }
    
    // Close HTTP server
    if (server) {
      console.log('⏹️ Closing HTTP server...');
      server.close((err) => {
        if (err) {
          console.error('❌ Error closing HTTP server:', err);
        } else {
          console.log('✅ HTTP server closed');
        }
      });
    }
    
    // Close MongoDB connection
    if (client) {
      console.log('⏹️ Closing MongoDB connection...');
      try {
        await client.close(true); // Force close
        console.log('✅ MongoDB connection closed');
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
      }
    }
    
    // Reset connection state
    isConnected = false;
    db = null;
    client = null;
    
    console.log('✅ Cleanup completed. Exiting...');
    
    // Force exit after 3 seconds if process doesn't terminate
    setTimeout(() => {
      console.log('🔄 Force exiting process...');
      process.exit(0);
    }, 3000);
  };

  // Handle different termination signals
  process.on('SIGINT', () => cleanup('SIGINT'));   // Ctrl+C
  process.on('SIGTERM', () => cleanup('SIGTERM')); // Termination signal
  process.on('SIGHUP', () => cleanup('SIGHUP'));   // Hang up signal
  
  // Handle Windows-specific signals
  if (process.platform === 'win32') {
    process.on('SIGBREAK', () => cleanup('SIGBREAK'));
  }
  
  // Enhanced uncaught exception handler
  process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught Exception:', error);
    console.error('Stack trace:', error.stack);
    
    // Try to log to a file as well if possible
    try {
      const fs = require('fs');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] UNCAUGHT EXCEPTION: ${error.message}\nStack: ${error.stack}\n\n`;
      fs.appendFileSync('mongodb-api-errors.log', logEntry);
    } catch (logError) {
      console.error('Failed to write error log:', logError);
    }
    
    await cleanup('UNCAUGHT_EXCEPTION');
  });
  
  // Enhanced unhandled rejection handler
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('💥 Unhandled Promise Rejection at:', promise);
    console.error('Reason:', reason);
    
    // Try to log to a file as well if possible
    try {
      const fs = require('fs');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] UNHANDLED REJECTION: ${reason}\nPromise: ${promise}\n\n`;
      fs.appendFileSync('mongodb-api-errors.log', logEntry);
    } catch (logError) {
      console.error('Failed to write error log:', logError);
    }
    
    // Don't exit immediately for unhandled rejections, but log them
    console.log('🔄 Attempting to recover from unhandled rejection...');
    
    // If we get too many unhandled rejections, we should restart
    if (!process.env.REJECTION_COUNT) {
      process.env.REJECTION_COUNT = '0';
    }
    process.env.REJECTION_COUNT = (parseInt(process.env.REJECTION_COUNT) + 1).toString();
    
    if (parseInt(process.env.REJECTION_COUNT) > 5) {
      console.error('❌ Too many unhandled rejections. Shutting down...');
      await cleanup('MULTIPLE_UNHANDLED_REJECTIONS');
    }
  });

  // Handle memory warnings
  process.on('warning', (warning) => {
    console.warn('⚠️ Process Warning:', warning.name, warning.message);
    if (warning.name === 'MaxListenersExceededWarning') {
      console.warn('💡 Consider reviewing event listener usage to prevent memory leaks');
    }
  });
}

// Enhanced server startup with better error handling
async function startServer() {
  console.log('🔄 Starting MongoDB API server...');
  console.log(`📊 Process ID: ${process.pid}`);
  console.log(`🔧 Node.js version: ${process.version}`);
  console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  
  // Setup graceful shutdown handlers first
  setupGracefulShutdown();
  
  try {
    // Attempt MongoDB connection with retry logic
    console.log('🔄 Attempting MongoDB connection...');
    const mongoConnected = await connectToMongoDB();
    
    console.log(`🔄 Starting Express server on port ${PORT}...`);
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MongoDB API server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Process ID: ${process.pid}`);
      
      if (mongoConnected) {
        console.log(`✅ MongoDB connected - using real data`);
      } else {
        console.log(`⚠️  MongoDB not available - API will return empty/fallback responses`);
        console.log(`🔄 Automatic reconnection attempts will continue in background`);
      }
      
      console.log('📝 Press Ctrl+C to stop the server');
    });
    
    // Enhanced server error handling
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${PORT} is already in use.`);
        console.log('💡 Possible solutions:');
        console.log('   - Kill the process using the port');
        console.log('   - Use a different port');
        console.log('   - Wait a moment and try again');
        process.exit(1);
      } else if (err.code === 'EACCES') {
        console.log(`⚠️ Permission denied for port ${PORT}`);
        console.log('💡 Try using a port number above 1024');
        process.exit(1);
      } else {
        console.error('💥 Unexpected server error:', err);
        // Try to restart after a delay
        setTimeout(() => {
          console.log('🔄 Attempting server restart...');
          startServer();
        }, 5000);
      }
    });
    
    server.on('close', () => {
      console.log('🔄 Express server closed');
    });

    // Set server timeout to prevent hanging connections
    server.timeout = 30000; // 30 seconds
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds

    // Monitor server connections
    let connections = 0;
    server.on('connection', (socket) => {
      connections++;
      console.log(`🔗 New connection established (total: ${connections})`);
      
      socket.on('close', () => {
        connections--;
        console.log(`🔗 Connection closed (total: ${connections})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error.stack);
    
    // Try fallback server start
    console.log('🔄 Attempting fallback server start...');
    try {
      server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 MongoDB API server running on http://localhost:${PORT} (fallback mode)`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log('⚠️ Running in fallback mode - some features may be limited');
      });
      
      server.on('error', (err) => {
        console.error('❌ Fallback server error:', err);
        console.error('💥 Unable to start server. Exiting...');
        process.exit(1);
      });
    } catch (fallbackError) {
      console.error('❌ Fallback server also failed:', fallbackError);
      console.error('💥 Complete server failure. Exiting...');
      process.exit(1);
    }
  }
}

// Add process monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Log memory usage every 5 minutes
  if (memUsedMB > 100) { // Only log if using more than 100MB
    console.log(`📊 Memory usage: ${memUsedMB}MB (heap: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB)`);
  }
  
  // Warn if memory usage is getting high
  if (memUsedMB > 500) {
    console.warn(`⚠️ High memory usage detected: ${memUsedMB}MB`);
  }
}, 300000); // 5 minutes

// Start the server
startServer().catch(error => {
  console.error('❌ Critical startup error:', error);
  console.error('Stack trace:', error.stack);
  
  // Last resort emergency server
  try {
    console.log('🆘 Starting emergency server...');
    app.listen(PORT, () => {
      console.log(`🚀 MongoDB API server running on http://localhost:${PORT} (emergency mode)`);
      console.log('⚠️ Emergency mode - minimal functionality available');
    });
  } catch (emergencyError) {
    console.error('❌ Emergency server failed:', emergencyError);
    console.error('💥 Complete system failure. Exiting...');
    process.exit(1);
  }
});
