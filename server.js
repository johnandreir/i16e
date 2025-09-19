import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      node_version: process.version,
      uptime: process.uptime()
    }
  });
});

app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStates = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: mongoStatus === 1 ? 'healthy' : 'unhealthy',
    mongodb: {
      status: mongoStates[mongoStatus] || 'unknown',
      readyState: mongoStatus,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.db?.databaseName
    },
    server: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime())
    },
    timestamp: new Date().toISOString()
  });
});

// Test MongoDB connection endpoint
app.get('/api/test-mongodb', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ 
      success: true, 
      message: 'MongoDB connection test successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:novirus@localhost:27017/devops-insight-engine?authSource=admin';

// Enhanced MongoDB connection with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('🔄 Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔌 MongoDB connected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT. Graceful shutdown...');
  await mongoose.connection.close();
  console.log('📊 MongoDB connection closed.');
  process.exit(0);
});

// Initial connection
connectWithRetry();

// MongoDB Schemas
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const squadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  description: { type: String, trim: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const dpeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  squad_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad', required: true },
  email: { type: String, trim: true, lowercase: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const performanceMetricSchema = new mongoose.Schema({
  dpe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DPE', required: true },
  sct: { type: Number, required: true, min: 0 },
  cases: { type: Number, required: true, min: 0 },
  satisfaction: { type: Number, required: true, min: 0, max: 100 },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

// Update timestamps before saving
teamSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

squadSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

dpeSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Models
const Team = mongoose.model('Team', teamSchema);
const Squad = mongoose.model('Squad', squadSchema);
const DPE = mongoose.model('DPE', dpeSchema);
const PerformanceMetric = mongoose.model('PerformanceMetric', performanceMetricSchema);

// Helper function to convert MongoDB document to API format
const convertDoc = (doc) => {
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  
  // Convert ObjectId references to strings
  if (obj.team_id) obj.team_id = obj.team_id.toString();
  if (obj.squad_id) obj.squad_id = obj.squad_id.toString();
  if (obj.dpe_id) obj.dpe_id = obj.dpe_id.toString();
  
  // Convert dates to ISO strings
  if (obj.created_at) obj.created_at = obj.created_at.toISOString();
  if (obj.updated_at) obj.updated_at = obj.updated_at.toISOString();
  if (obj.period_start) obj.period_start = obj.period_start.toISOString();
  if (obj.period_end) obj.period_end = obj.period_end.toISOString();
  
  return obj;
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Team routes
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.find().sort({ created_at: -1 });
    res.json(teams.map(convertDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = new Team({ name, description });
    const savedTeam = await team.save();
    res.status(201).json(convertDoc(savedTeam));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/teams/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(convertDoc(updatedTeam));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    // Check if there are squads associated with this team
    const squadsCount = await Squad.countDocuments({ team_id: req.params.id });
    if (squadsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete team with associated squads' });
    }

    const deletedTeam = await Team.findByIdAndDelete(req.params.id);
    if (!deletedTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Squad routes
app.get('/api/squads', async (req, res) => {
  try {
    const squads = await Squad.find().sort({ created_at: -1 });
    res.json(squads.map(convertDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/squads', async (req, res) => {
  try {
    const { name, team_id, description } = req.body;
    
    // Verify team exists
    const team = await Team.findById(team_id);
    if (!team) {
      return res.status(400).json({ error: 'Team not found' });
    }

    const squad = new Squad({ name, team_id, description });
    const savedSquad = await squad.save();
    res.status(201).json(convertDoc(savedSquad));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/squads/:id', async (req, res) => {
  try {
    const { name, team_id, description } = req.body;
    
    // Verify team exists
    const team = await Team.findById(team_id);
    if (!team) {
      return res.status(400).json({ error: 'Team not found' });
    }

    const updatedSquad = await Squad.findByIdAndUpdate(
      req.params.id,
      { name, team_id, description, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedSquad) {
      return res.status(404).json({ error: 'Squad not found' });
    }
    
    res.json(convertDoc(updatedSquad));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/squads/:id', async (req, res) => {
  try {
    // Check if there are DPEs associated with this squad
    const dpesCount = await DPE.countDocuments({ squad_id: req.params.id });
    if (dpesCount > 0) {
      return res.status(400).json({ error: 'Cannot delete squad with associated DPEs' });
    }

    const deletedSquad = await Squad.findByIdAndDelete(req.params.id);
    if (!deletedSquad) {
      return res.status(404).json({ error: 'Squad not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DPE routes
app.get('/api/dpes', async (req, res) => {
  try {
    const dpes = await DPE.find().sort({ created_at: -1 });
    res.json(dpes.map(convertDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/dpes', async (req, res) => {
  try {
    const { name, squad_id, email } = req.body;
    
    // Verify squad exists
    const squad = await Squad.findById(squad_id);
    if (!squad) {
      return res.status(400).json({ error: 'Squad not found' });
    }

    const dpe = new DPE({ name, squad_id, email });
    const savedDPE = await dpe.save();
    res.status(201).json(convertDoc(savedDPE));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/dpes/:id', async (req, res) => {
  try {
    const { name, squad_id, email } = req.body;
    
    // Verify squad exists
    const squad = await Squad.findById(squad_id);
    if (!squad) {
      return res.status(400).json({ error: 'Squad not found' });
    }

    const updatedDPE = await DPE.findByIdAndUpdate(
      req.params.id,
      { name, squad_id, email, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedDPE) {
      return res.status(404).json({ error: 'DPE not found' });
    }
    
    res.json(convertDoc(updatedDPE));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/dpes/:id', async (req, res) => {
  try {
    // Delete all performance metrics for this DPE first
    await PerformanceMetric.deleteMany({ dpe_id: req.params.id });
    
    const deletedDPE = await DPE.findByIdAndDelete(req.params.id);
    if (!deletedDPE) {
      return res.status(404).json({ error: 'DPE not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Performance Metrics routes
app.get('/api/metrics', async (req, res) => {
  try {
    let query = {};
    
    if (req.query.dpe_id) {
      query.dpe_id = req.query.dpe_id;
    }
    
    if (req.query.start_date && req.query.end_date) {
      query.period_start = { $gte: new Date(req.query.start_date) };
      query.period_end = { $lte: new Date(req.query.end_date) };
    }
    
    const metrics = await PerformanceMetric.find(query).sort({ period_start: -1 });
    res.json(metrics.map(convertDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/metrics', async (req, res) => {
  try {
    const { dpe_id, sct, cases, satisfaction, period_start, period_end } = req.body;
    
    // Verify DPE exists
    const dpe = await DPE.findById(dpe_id);
    if (!dpe) {
      return res.status(400).json({ error: 'DPE not found' });
    }

    const metric = new PerformanceMetric({
      dpe_id,
      sct,
      cases,
      satisfaction,
      period_start: new Date(period_start),
      period_end: new Date(period_end)
    });
    
    const savedMetric = await metric.save();
    res.status(201).json(convertDoc(savedMetric));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Hierarchy route
app.get('/api/hierarchy', async (req, res) => {
  try {
    const teams = await Team.aggregate([
      {
        $lookup: {
          from: 'squads',
          localField: '_id',
          foreignField: 'team_id',
          as: 'squads'
        }
      },
      {
        $unwind: {
          path: '$squads',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'dpes',
          localField: 'squads._id',
          foreignField: 'squad_id',
          as: 'dpes'
        }
      },
      {
        $unwind: {
          path: '$dpes',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          team_id: { $toString: '$_id' },
          team_name: '$name',
          squad_id: { $toString: '$squads._id' },
          squad_name: '$squads.name',
          dpe_id: { $toString: '$dpes._id' },
          dpe_name: '$dpes.name',
          dpe_email: '$dpes.email'
        }
      }
    ]);

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all data route
app.delete('/api/clear', async (req, res) => {
  try {
    console.log('Clearing all MongoDB data...');
    
    await PerformanceMetric.deleteMany({});
    console.log('Deleted all performance metrics');
    
    await DPE.deleteMany({});
    console.log('Deleted all DPEs');
    
    await Squad.deleteMany({});
    console.log('Deleted all squads');
    
    await Team.deleteMany({});
    console.log('Deleted all teams');
    
    console.log('MongoDB database cleared successfully!');
    res.json({ success: true, message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Error clearing MongoDB database:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', (error) => {
  if (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Server listening on all interfaces (0.0.0.0:${PORT})`);
});

export default app;