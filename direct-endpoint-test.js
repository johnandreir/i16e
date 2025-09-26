// Temporary simplified DPE update endpoint for testing
app.put('/api/dpe/:id/direct', async (req, res) => {
  try {
    console.log('🔄 Direct DPE update request received:', req.params.id, req.body);
    
    const { id } = req.params;
    const { name, squadID, email, role } = req.body;

    // Validate ObjectIds
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid DPE ID format' });
    }

    const updateData = {
      name,
      squadID: squadID,
      email: email,
      role: role
    };

    console.log('📝 Direct update - bypassing performDatabaseOperation');
    console.log('🔍 Direct check - isConnected:', isConnected, 'db exists:', !!db);

    // Direct database operation without performDatabaseOperation wrapper
    if (!db) {
      return res.status(503).json({ error: 'Database not available - db is null' });
    }

    const collection = db.collection('dpes');
    console.log('📝 Collection object:', !!collection);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    console.log('✅ Direct update result:', result);

    if (!result) {
      return res.status(404).json({ error: 'DPE not found' });
    }

    const response = {
      id: result._id.toString(),
      name: result.name,
      squadID: result.squadID || result.squadId,
      email: result.email,
      role: result.role,
      created_at: result.created_at?.toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Direct DPE update successful:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Direct DPE update error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});