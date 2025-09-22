const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

// Enhanced process management and crash prevention
process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  // Log but don't exit immediately - attempt graceful recovery
  setTimeout(() => {
    console.log('🔄 Attempting graceful recovery from uncaught exception...');
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but continue running - most unhandled rejections are recoverable
});

process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, performing graceful shutdown...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT (Ctrl+C), performing graceful shutdown...');
  gracefulShutdown();
});

// Memory monitoring and leak prevention
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  if (memMB > 512) { // Alert if using more than 512MB
    console.warn(`⚠️ High memory usage: ${memMB}MB`);
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
}, 60000); // Check every minute

const app = express();
const PORT = 3001;

// MongoDB connection configuration with robust settings
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

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

    db = client.db('i16e-db');
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
app.get('/api/team', async (req, res) => {
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
      created_at: (team.created_at || team.createdAt)?.toISOString() || new Date().toISOString(),
      updated_at: (team.updated_at || team.updatedAt)?.toISOString() || new Date().toISOString()
    }));

    res.json(formattedTeams);
  } catch (error) {
    console.error('❌ Error in /api/teams endpoint:', error);
    res.status(500).json({ error: 'Internal server error', data: [] });
  }
});

app.post('/api/team', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, cannot create team');
      return res.status(503).json({ error: 'Database not available' });
    }

    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    // Trim and normalize the name
    const normalizedName = name.trim();
    
    if (!normalizedName) {
      return res.status(400).json({ error: 'Team name cannot be empty' });
    }

    // Check for duplicate team names (case-insensitive)
    const duplicateCheckOperation = async (collection) => {
      return await collection.findOne({ 
        name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      });
    };

    const duplicateResult = await performDatabaseOperation(duplicateCheckOperation, 'teams', 'check duplicate team');
    
    if (duplicateResult.success && duplicateResult.data) {
      return res.status(409).json({ 
        error: 'Team name already exists',
        existingTeam: {
          id: duplicateResult.data._id.toString(),
          name: duplicateResult.data.name
        }
      });
    }

    const now = new Date();
    const teamData = {
      name: normalizedName,
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
        created_at: teamData.created_at.toISOString(),
        updated_at: teamData.updated_at.toISOString()
      });
    }

    const team = findResult.data;
    res.json({
      id: team._id.toString(),
      name: team.name,
      created_at: team.created_at.toISOString(),
      updated_at: team.updated_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Squads endpoints with robust error handling
app.get('/api/squad', async (req, res) => {
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
      teamID: (squad.teamID || squad.teamId || squad.team_id)?.toString() || null,
      created_at: (squad.created_at || squad.createdAt)?.toISOString() || new Date().toISOString(),
      updated_at: (squad.updated_at || squad.updatedAt)?.toISOString() || new Date().toISOString()
    }));

    res.json(formattedSquads);
  } catch (error) {
    console.error('❌ Error in /api/squads endpoint:', error);
    res.status(500).json({ error: 'Internal server error', data: [] });
  }
});

app.post('/api/squad', async (req, res) => {
  try {
    console.log('🔄 Squad creation request received:', req.body);
    
    if (!isConnected || !db) {
      console.log('❌ MongoDB not connected, cannot create squad');
      return res.status(503).json({ error: 'Database not available' });
    }

    const { name, teamID } = req.body;
    console.log('📝 Request data - name:', name, 'teamID:', teamID);

    // Validate required fields
    if (!name) {
      console.log('❌ Missing required field: name');
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    // Trim and normalize the name
    const normalizedName = name.trim();
    console.log('✅ Normalized name:', normalizedName);
    
    if (!normalizedName) {
      console.log('❌ Squad name cannot be empty after trimming');
      return res.status(400).json({ error: 'Squad name cannot be empty' });
    }

    // Check for duplicate squad names (case-insensitive)
    console.log('🔍 Checking for duplicate squad names...');
    const duplicateCheckOperation = async (collection) => {
      return await collection.findOne({ 
        name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      });
    };

    const duplicateResult = await performDatabaseOperation(duplicateCheckOperation, 'squads', 'check duplicate squad');
    console.log('🔍 Duplicate check result:', duplicateResult);
    
    if (duplicateResult.success && duplicateResult.data) {
      console.log('❌ Squad name already exists:', duplicateResult.data);
      return res.status(409).json({ 
        error: 'Squad name already exists',
        existingSquad: {
          id: duplicateResult.data._id.toString(),
          name: duplicateResult.data.name
        }
      });
    }

    const now = new Date();
    
    const squadData = {
      name: normalizedName,
      teamID: teamID,      // Use teamID as string
      created_at: now,     // Use created_at with underscore
      updated_at: now      // Use updated_at with underscore
    };
    console.log('📝 Squad data to insert:', squadData);

    const insertOperation = async (collection) => {
      return await collection.insertOne(squadData);
    };

    console.log('💾 Attempting to insert squad...');
    const insertResult = await performDatabaseOperation(insertOperation, 'squads', 'insert squad');
    console.log('💾 Insert result:', insertResult);

    if (!insertResult.success) {
      console.error('❌ Failed to create squad - detailed error:', insertResult);
      return res.status(503).json({ error: 'Failed to create squad', details: insertResult.error });
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
        teamID: squadData.teamID,
        created_at: squadData.created_at.toISOString(),
        updated_at: squadData.updated_at.toISOString()
      });
    }

    const squad = findResult.data;
    res.json({
      id: squad._id.toString(),
      name: squad.name,
      teamID: squad.teamID,                     // Use consistent teamID field
      created_at: squad.created_at.toISOString(),  // Use consistent created_at field
      updated_at: squad.updated_at.toISOString()   // Use consistent updated_at field
    });
  } catch (error) {
    console.error('❌ Error creating squad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DPEs endpoints with robust error handling
app.get('/api/dpe', async (req, res) => {
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
      squadID: (dpe.squadID || dpe.squadId || dpe.squad_id)?.toString() || null,
      created_at: (dpe.created_at || dpe.createdAt)?.toISOString() || new Date().toISOString(),
      updated_at: (dpe.updated_at || dpe.updatedAt)?.toISOString() || new Date().toISOString()
    }));

    res.json(formattedDPEs);
  } catch (error) {
    console.error('❌ Error in /api/dpes endpoint:', error);
    res.status(500).json({ error: 'Internal server error', data: [] });
  }
});

app.post('/api/dpe', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, cannot create dpe');
      return res.status(503).json({ error: 'Database not available' });
    }

    const { name, squadID } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    // Trim and normalize the name
    const normalizedName = name.trim();
    
    if (!normalizedName) {
      return res.status(400).json({ error: 'DPE name cannot be empty' });
    }

    // Check for duplicate DPE names (case-insensitive)
    const duplicateCheckOperation = async (collection) => {
      return await collection.findOne({ 
        name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      });
    };

    const duplicateResult = await performDatabaseOperation(duplicateCheckOperation, 'dpes', 'check duplicate dpe');
    
    if (duplicateResult.success && duplicateResult.data) {
      return res.status(409).json({ 
        error: 'DPE name already exists',
        existingDPE: {
          id: duplicateResult.data._id.toString(),
          name: duplicateResult.data.name
        }
      });
    }

    const now = new Date();
    const dpeData = {
      name: normalizedName,
      squadID,
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
        squadID: dpeData.squadID ? dpeData.squadID.toString() : dpeData.squadID,
        created_at: dpeData.created_at.toISOString(),
        updated_at: dpeData.updated_at.toISOString()
      });
    }

    const dpe = findResult.data;
    res.json({
      id: dpe._id.toString(),
      name: dpe.name,
      squadID: dpe.squadID ? dpe.squadID.toString() : dpe.squadID,
      created_at: dpe.created_at.toISOString(),
      updated_at: dpe.updated_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating dpe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT and DELETE endpoints for Teams
app.put('/api/team/:id', async (req, res) => {
  try {
    if (!isConnected || !db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const { ObjectId } = require('mongodb');
    const updateData = {
      name,
      updated_at: new Date()
    };

    const updateOperation = async (collection) => {
      return await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    };

    const result = await performDatabaseOperation(updateOperation, 'teams', 'update team');

    if (!result.success) {
      return res.status(503).json({ error: 'Failed to update team' });
    }

    if (!result.data.value) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = result.data.value;
    res.json({
      id: team._id.toString(),
      name: team.name,
      created_at: team.created_at.toISOString(),
      updated_at: team.updated_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/team/:id', async (req, res) => {
  try {
    if (!isConnected || !db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { ObjectId } = require('mongodb');

    // Check if team has squads
    const checkSquadsOperation = async (collection) => {
      return await collection.findOne({ team_id: new ObjectId(id) });
    };

    const squadsCheck = await performDatabaseOperation(checkSquadsOperation, 'squads', 'check team squads');

    if (squadsCheck.success && squadsCheck.data) {
      return res.status(400).json({ error: 'Cannot delete team that has squads assigned to it' });
    }

    const deleteOperation = async (collection) => {
      return await collection.deleteOne({ _id: new ObjectId(id) });
    };

    const result = await performDatabaseOperation(deleteOperation, 'teams', 'delete team');

    if (!result.success) {
      return res.status(503).json({ error: 'Failed to delete team' });
    }

    if (result.data.deletedCount === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT and DELETE endpoints for Squads
app.put('/api/squad/:id', async (req, res) => {
  try {
    if (!isConnected || !db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { name, teamID, description } = req.body;

    if (!name || !teamID) {
      return res.status(400).json({ error: 'Squad name and teamID are required' });
    }

    const { ObjectId } = require('mongodb');

    // Verify team exists
    const checkTeamOperation = async (collection) => {
      return await collection.findOne({ _id: new ObjectId(teamID) });
    };

    const teamCheck = await performDatabaseOperation(checkTeamOperation, 'teams', 'check team exists');

    if (!teamCheck.success || !teamCheck.data) {
      return res.status(400).json({ error: 'Selected team does not exist' });
    }

    const updateData = {
      name,
      teamID: new ObjectId(teamID),
      description,
      updated_at: new Date()
    };

    const updateOperation = async (collection) => {
      return await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    };

    const result = await performDatabaseOperation(updateOperation, 'squads', 'update squad');

    if (!result.success) {
      return res.status(503).json({ error: 'Failed to update squad' });
    }

    if (!result.data.value) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    const squad = result.data.value;
    res.json({
      id: squad._id.toString(),
      name: squad.name,
      team_id: squad.team_id.toString(),
      created_at: squad.created_at.toISOString(),
      updated_at: squad.updated_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating squad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/squad/:id', async (req, res) => {
  try {
    if (!isConnected || !db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { ObjectId } = require('mongodb');

    // Check if squad has DPEs
    const checkDPEsOperation = async (collection) => {
      return await collection.findOne({ squad_id: new ObjectId(id) });
    };

    const dpesCheck = await performDatabaseOperation(checkDPEsOperation, 'dpes', 'check squad dpes');

    if (dpesCheck.success && dpesCheck.data) {
      return res.status(400).json({ error: 'Cannot delete squad that has DPEs assigned to it' });
    }

    const deleteOperation = async (collection) => {
      return await collection.deleteOne({ _id: new ObjectId(id) });
    };

    const result = await performDatabaseOperation(deleteOperation, 'squads', 'delete squad');

    if (!result.success) {
      return res.status(503).json({ error: 'Failed to delete squad' });
    }

    if (result.data.deletedCount === 0) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    res.json({ message: 'Squad deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting squad:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT and DELETE endpoints for DPEs
app.put('/api/dpe/:id', async (req, res) => {
  try {
    if (!isConnected || !db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { name, squadID, email, role } = req.body;

    if (!name || !squadID) {
      return res.status(400).json({ error: 'DPE name and squadID are required' });
    }

    const { ObjectId } = require('mongodb');

    // Verify squad exists
    const checkSquadOperation = async (collection) => {
      return await collection.findOne({ _id: new ObjectId(squadID) });
    };

    const squadCheck = await performDatabaseOperation(checkSquadOperation, 'squads', 'check squad exists');

    if (!squadCheck.success || !squadCheck.data) {
      return res.status(400).json({ error: 'Selected squad does not exist' });
    }

    const updateData = {
      name,
      squadID: new ObjectId(squadID),
      updated_at: new Date()
    };

    const updateOperation = async (collection) => {
      return await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
    };

    const result = await performDatabaseOperation(updateOperation, 'dpes', 'update dpe');

    if (!result.success) {
      return res.status(503).json({ error: 'Failed to update DPE' });
    }

    if (!result.data.value) {
      return res.status(404).json({ error: 'DPE not found' });
    }

    const dpe = result.data.value;
    res.json({
      id: dpe._id.toString(),
      name: dpe.name,
      squad_id: dpe.squad_id.toString(),
      created_at: dpe.created_at.toISOString(),
      updated_at: dpe.updated_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating DPE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/dpe/:id', async (req, res) => {
  try {
    if (!isConnected || !db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const { ObjectId } = require('mongodb');

    const deleteOperation = async (collection) => {
      return await collection.deleteOne({ _id: new ObjectId(id) });
    };

    const result = await performDatabaseOperation(deleteOperation, 'dpes', 'delete dpe');

    if (!result.success) {
      return res.status(503).json({ error: 'Failed to delete DPE' });
    }

    if (result.data.deletedCount === 0) {
      return res.status(404).json({ error: 'DPE not found' });
    }

    res.json({ message: 'DPE deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting DPE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Performance Data endpoints
app.get('/api/performance-data', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, returning empty performance data');
      return res.json([]);
    }

    const { entityType, entityId, startDate, endDate } = req.query;

    let filter = {};
    if (entityType && entityId) {
      const { ObjectId } = require('mongodb');
      filter.entity_type = entityType;
      filter.entity_id = new ObjectId(entityId);
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const operation = async (collection) => {
      return await collection.find(filter).sort({ date: -1 }).toArray();
    };

    const result = await performDatabaseOperation(operation, 'performance_data', 'fetch performance data');

    if (!result.success) {
      console.error('Failed to fetch performance data:', result.error);
      return res.status(503).json({ error: 'Failed to fetch performance data', data: [] });
    }

    const formattedData = result.data.map(item => ({
      id: item._id.toString(),
      entity_id: item.entity_id.toString(),
      entity_type: item.entity_type,
      date: item.date.toISOString(),
      metrics: item.metrics,
      created_at: item.created_at.toISOString()
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('❌ Error in /api/performance-data endpoint:', error);
    res.status(500).json({ error: 'Internal server error', data: [] });
  }
});

app.post('/api/performance-data', async (req, res) => {
  try {
    if (!isConnected || !db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { entity_id, entity_type, date, metrics } = req.body;

    if (!entity_id || !entity_type || !date || !metrics) {
      return res.status(400).json({ error: 'Missing required fields: entity_id, entity_type, date, metrics' });
    }

    if (!['team', 'squad', 'dpe'].includes(entity_type)) {
      return res.status(400).json({ error: 'entity_type must be team, squad, or dpe' });
    }

    const { ObjectId } = require('mongodb');
    const performanceData = {
      entity_id: new ObjectId(entity_id),
      entity_type,
      date: new Date(date),
      metrics,
      created_at: new Date()
    };

    const insertOperation = async (collection) => {
      return await collection.insertOne(performanceData);
    };

    const result = await performDatabaseOperation(insertOperation, 'performance_data', 'insert performance data');

    if (!result.success) {
      return res.status(503).json({ error: 'Failed to create performance data' });
    }

    res.json({
      id: result.data.insertedId.toString(),
      entity_id: performanceData.entity_id.toString(),
      entity_type: performanceData.entity_type,
      date: performanceData.date.toISOString(),
      metrics: performanceData.metrics,
      created_at: performanceData.created_at.toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating performance data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Data deletion endpoints for cleaning collections
app.delete('/api/collections/clear', async (req, res) => {
  try {
    if (!isConnected || !db) {
      console.log('MongoDB not connected, cannot clear collections');
      return res.status(503).json({ 
        error: 'Database not connected',
        success: false 
      });
    }

    const { collections } = req.body;
    
    // Validate collections parameter
    if (!collections || !Array.isArray(collections)) {
      return res.status(400).json({ 
        error: 'Collections parameter must be an array',
        success: false 
      });
    }

    const allowedCollections = ['dpes', 'performance_data', 'squads', 'teams'];
    const invalidCollections = collections.filter(col => !allowedCollections.includes(col));
    
    if (invalidCollections.length > 0) {
      return res.status(400).json({ 
        error: `Invalid collections: ${invalidCollections.join(', ')}. Allowed: ${allowedCollections.join(', ')}`,
        success: false 
      });
    }

    const results = {};
    
    for (const collectionName of collections) {
      try {
        const deleteResult = await performDatabaseOperation(
          async (collection) => collection.deleteMany({}),
          collectionName,
          `clear ${collectionName} collection`
        );
        
        if (deleteResult.success) {
          results[collectionName] = {
            success: true,
            deletedCount: deleteResult.data.deletedCount || 0
          };
        } else {
          results[collectionName] = {
            success: false,
            error: deleteResult.error
          };
        }
      } catch (error) {
        results[collectionName] = {
          success: false,
          error: error.message
        };
      }
    }

    const allSuccessful = Object.values(results).every(result => result.success);
    const totalDeleted = Object.values(results).reduce((sum, result) => 
      sum + (result.success ? result.deletedCount : 0), 0
    );

    console.log(`🗑️  Cleared ${collections.length} collection(s), deleted ${totalDeleted} documents total`);

    res.json({
      success: allSuccessful,
      totalDeleted,
      collections: results
    });

  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    res.status(500).json({ 
      error: 'Internal server error during collection clearing',
      success: false 
    });
  }
});

// Entity validation endpoint
app.get('/api/entities/validate', async (req, res) => {
  try {
    if (!isConnected || !db) {
      return res.status(503).json({
        error: 'Database not available',
        valid: false,
        issues: ['Database connection unavailable']
      });
    }

    // Fetch all entities
    const [teamsOp, squadsOp, dpesOp] = await Promise.all([
      performDatabaseOperation(async (collection) => collection.find({}).toArray(), 'teams', 'fetch teams for validation'),
      performDatabaseOperation(async (collection) => collection.find({}).toArray(), 'squads', 'fetch squads for validation'),
      performDatabaseOperation(async (collection) => collection.find({}).toArray(), 'dpes', 'fetch dpes for validation')
    ]);

    if (!teamsOp.success || !squadsOp.success || !dpesOp.success) {
      return res.status(503).json({
        error: 'Failed to fetch entity data for validation',
        valid: false,
        issues: ['Database query failed']
      });
    }

    const teams = teamsOp.data || [];
    const squads = squadsOp.data || [];
    const dpes = dpesOp.data || [];

    const issues = [];
    const warnings = [];

    // Check for orphaned squads (squads without valid teams)
    const orphanedSquads = squads.filter(squad =>
      !teams.some(team => team._id.toString() === squad.team_id?.toString())
    );

    if (orphanedSquads.length > 0) {
      issues.push({
        type: 'orphaned_squads',
        count: orphanedSquads.length,
        entities: orphanedSquads.map(s => s.name),
        message: `${orphanedSquads.length} squad(s) are not mapped to any existing team`
      });
    }

    // Check for orphaned DPEs (DPEs without valid squads)
    const orphanedDPEs = dpes.filter(dpe =>
      !squads.some(squad => squad._id.toString() === dpe.squad_id?.toString())
    );

    if (orphanedDPEs.length > 0) {
      issues.push({
        type: 'orphaned_dpes',
        count: orphanedDPEs.length,
        entities: orphanedDPEs.map(d => d.name),
        message: `${orphanedDPEs.length} DPE(s) are not mapped to any existing squad`
      });
    }

    // Check for teams without squads (warning)
    const emptyTeams = teams.filter(team =>
      !squads.some(squad => squad.team_id?.toString() === team._id.toString())
    );

    if (emptyTeams.length > 0) {
      warnings.push({
        type: 'empty_teams',
        count: emptyTeams.length,
        entities: emptyTeams.map(t => t.name),
        message: `${emptyTeams.length} team(s) have no squads assigned`
      });
    }

    // Check for squads without DPEs (warning)
    const emptySquads = squads.filter(squad =>
      !dpes.some(dpe => dpe.squad_id?.toString() === squad._id.toString())
    );

    if (emptySquads.length > 0) {
      warnings.push({
        type: 'empty_squads',
        count: emptySquads.length,
        entities: emptySquads.map(s => s.name),
        message: `${emptySquads.length} squad(s) have no DPEs assigned`
      });
    }

    const isValid = issues.length === 0;

    res.json({
      valid: isValid,
      summary: {
        totalTeams: teams.length,
        totalSquads: squads.length,
        totalDPEs: dpes.length,
        orphanedSquads: orphanedSquads.length,
        orphanedDPEs: orphanedDPEs.length,
        emptyTeams: emptyTeams.length,
        emptySquads: emptySquads.length
      },
      issues,
      warnings,
      totalIssues: issues.length,
      totalWarnings: warnings.length,
      lastValidated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error validating entities:', error);
    res.status(500).json({
      error: 'Internal server error during validation',
      valid: false,
      issues: ['Server error during validation']
    });
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

// Graceful shutdown function
async function gracefulShutdown(signal = 'unknown') {
  console.log(`🛑 Graceful shutdown initiated (signal: ${signal})`);

  try {
    // Stop health check monitoring
    if (healthCheckTimer) {
      clearInterval(healthCheckTimer);
      console.log('✅ Health check monitoring stopped');
    }

    // Close MongoDB connection
    if (client) {
      await client.close();
      console.log('✅ MongoDB connection closed');
    }

    // Close HTTP server
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.log('⏰ Force closing server after timeout');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Server instance variable for graceful shutdown (moved to top)

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
