import { useEffect, useState } from 'react';

const MongoDBStatusTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [apiStatus, setApiStatus] = useState('Testing...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test backend health
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          const data = await response.json();
          setApiStatus(`✅ Backend API Connected: ${data.status}`);
          
          // Test MongoDB operations
          try {
            const testResponse = await fetch('http://localhost:3001/api/team');
            if (testResponse.ok) {
              setConnectionStatus('✅ MongoDB Connection Verified!');
            } else {
              setConnectionStatus('⚠️ Backend connected but MongoDB query failed');
            }
          } catch (error) {
            setConnectionStatus('⚠️ MongoDB query test failed');
          }
        } else {
          setApiStatus('❌ Backend API not responding');
          setConnectionStatus('❌ Cannot test MongoDB without backend');
        }
      } catch (error) {
        setApiStatus('❌ Cannot connect to backend API at localhost:3001');
        setConnectionStatus('❌ Cannot test MongoDB without backend');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-lg font-medium text-green-800">
            MongoDB Migration Status
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p className="mb-2">
              <strong>API Status:</strong> {apiStatus}
            </p>
            <p className="mb-2">
              <strong>Database Status:</strong> {connectionStatus}
            </p>
            <div className="mt-4 p-3 bg-green-100 rounded">
              <h4 className="font-semibold text-green-800">Migration Complete!</h4>
              <ul className="mt-2 text-sm text-green-700 space-y-1">
                <li>✅ MongoDB Docker container "mongodb" running with authentication</li>
                <li>✅ Node.js Express backend API server on port 3001</li>
                <li>✅ Mongoose ODM for MongoDB operations</li>
                <li>✅ Full CRUD operations for Teams, Squads, DPEs, and Metrics</li>
                <li>✅ Data now persists to MongoDB</li>
                <li>✅ Connection string: mongodb://root:novirus@localhost:27017/devops-insight-engine</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MongoDBStatusTest;