// Environment configuration for the DevOps Insight Engine

export const environment = {
  // N8N Webhook Configuration
  webhook: {
    baseUrl: 'http://localhost:5678',
    endpoints: {
      dpePerformance: '/webhook-test/dpe-performance',
      getCases: '/webhook-test/get-cases',
      getPerformance: '/webhook-test/get-performance'
    },
    timeout: 30000, // 30 seconds
  },

  // MongoDB API Configuration
  mongodb: {
    apiUrl: 'http://localhost:3001',
    timeout: 10000, // 10 seconds
    endpoints: {
      health: '/health',
      teams: '/api/teams',
      squads: '/api/squads',
      dpes: '/api/dpes'
    }
  },

  // Eureka API Configuration  
  eureka: {
    baseUrl: 'https://eureka-api.example.com',
    timeout: 15000, // 15 seconds
    endpoints: {
      health: '/health',
      performance: '/api/performance',
      cases: '/api/cases'
    }
  },

  // Health Check Configuration
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    retryAttempts: 3,
    retryDelay: 2000 // 2 seconds
  },

  // Self-Healing Configuration
  selfHealing: {
    enabled: true,
    checkInterval: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 5000,     // 5 seconds
    autoRestart: false,   // Disabled for safety
    maxHealingActions: 100 // Keep last 100 healing actions
  },

  // Development flags
  development: {
    enableMockData: false,
    enableVerboseLogging: false,
    enableSelfHealing: true,
    enableHealthChecks: true
  }
};

// Helper functions to get full URLs
export const getWebhookUrl = (endpoint: keyof typeof environment.webhook.endpoints): string => {
  return ${environment.webhook.baseUrl};
};

export const getMongoUrl = (endpoint: keyof typeof environment.mongodb.endpoints): string => {
  return ${environment.mongodb.apiUrl};
};

export const getEurekaUrl = (endpoint: keyof typeof environment.eureka.endpoints): string => {
  return ${environment.eureka.baseUrl};
};

// Environment validation
export const validateEnvironment = (): boolean => {
  const requiredEnvVars = [
    'webhook.baseUrl',
    'mongodb.apiUrl'
  ];

  // This is a simplified validation - in a real app you'd check actual env vars
  return true;
};
