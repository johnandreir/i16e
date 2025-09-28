// Include both mock endpoints and correct n8n forwarding in one file
module.exports = function(app) {
  console.log('🔄 Setting up consolidated webhook handlers...');

  // Define priorities for different handlers
  // Lower number = higher priority (processed first)
  const PRIORITY = {
    N8N_PROXY: 1,   // First try to forward to n8n
    MOCK: 2         // Fall back to mock if n8n fails
  };

  // Helper function to try n8n first, then fall back to mock if needed
  const createEndpointWithFallback = (path, n8nEndpoint, mockHandler) => {
    app.post(path, async (req, res, next) => {
      console.log(`📍 [PRIORITY ${PRIORITY.N8N_PROXY}] Trying to forward to n8n: ${path}`);
      console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
      
      try {
        // Forward to the correct n8n webhook URL
        const n8nHost = process.env.IN_DOCKER === 'true' ? 'n8n' : 'localhost';
        const webhookUrl = `http://${n8nHost}:5678/webhook-test/${n8nEndpoint}`;
        console.log('🔄 Forwarding to n8n webhook:', webhookUrl);
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req.body),
          // Set a timeout to fail fast if n8n is not responding
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          throw new Error(`N8N webhook returned status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ N8N webhook response received:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        return res.json(data);
      } catch (error) {
        console.error(`❌ Error forwarding to n8n webhook: ${error.message}`);
        console.log('⚠️ Falling back to mock handler...');
        return mockHandler(req, res);
      }
    });
  };

  // SCT Analysis mock handler
  const mockSctHandler = (req, res) => {
    console.log(`📍 [PRIORITY ${PRIORITY.MOCK}] Using mock handler for analyze-sct`);
    
    // Return a mock successful response
    return res.json({
      success: true,
      message: "SCT Analysis completed successfully",
      data: {
        sct_metrics: [
          {
            owner_full_name: req.body.entity_name || "Test Engineer",
            sct: 3.5,
            case_count: 12
          }
        ],
        email_sentiment_analysis: [
          {
            problem: "Extended case duration leading to customer frustration due to complex issues",
            case_id: "TM-123456",
            recommendations: [
              "Coach on maintaining clear and concise communications",
              "Improve proactive status updates during complex investigations"
            ]
          }
        ],
        summary: {
          areas_for_improvement: [
            "Enhance customer communications by translating technical jargon",
            "Improve proactive engagement during long or complex cases"
          ],
          strengths: [
            "Demonstrated perseverance and persistence in complex cases",
            "Maintained professional and polite communication throughout"
          ]
        }
      }
    });
  };

  // Survey Analysis mock handler
  const mockSurveyHandler = (req, res) => {
    console.log(`📍 [PRIORITY ${PRIORITY.MOCK}] Using mock handler for analyze-survey`);
    
    // Return a mock successful response
    return res.json({
      success: true,
      message: "Survey Analysis completed successfully",
      data: {
        survey_metrics: {
          satisfaction_score: 4.2,
          dsat_count: 2,
          neut_count: 3,
          sat_count: 15
        },
        sentiment_analysis: [
          {
            problem: "Technical explanations were too complex for customer understanding",
            case_id: "TM-654321",
            survey_type: "NEUT",
            recommendations: [
              "Simplify technical communications for customer understanding",
              "Provide visual aids when explaining complex concepts"
            ]
          }
        ],
        summary: {
          areas_for_improvement: [
            "Simplify technical language and explanations",
            "Improve follow-up communications"
          ],
          strengths: [
            "Strong technical expertise and problem-solving",
            "Professional and courteous customer interactions"
          ]
        }
      }
    });
  };

  // Register endpoints with fallback behavior
  createEndpointWithFallback('/api/n8n/webhook/analyze-sct', 'analyze-sct', mockSctHandler);
  createEndpointWithFallback('/api/n8n/webhook/analyze-survey', 'analyze-survey', mockSurveyHandler);
  
  // Also register the endpoints at the /mock/ paths for compatibility
  app.post('/api/n8n/mock/analyze-sct', mockSctHandler);
  app.post('/api/n8n/mock/analyze-survey', mockSurveyHandler);

  console.log('✅ Consolidated webhook handlers registered successfully');
};