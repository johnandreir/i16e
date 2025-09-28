// Mock n8n webhook endpoints for development and testing

module.exports = function(app) {
  // Mock endpoint for analyze-sct
  app.post('/api/n8n/mock/analyze-sct', async (req, res) => {
    console.log('📍 Mock N8N analyze-sct endpoint called');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    // Return a mock successful response
    res.json({
      success: true,
      message: "SCT Analysis completed successfully",
      data: {
        sct_metrics: [
          {
            owner_full_name: "Test Engineer",
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
  });

  // Mock endpoint for analyze-survey
  app.post('/api/n8n/mock/analyze-survey', async (req, res) => {
    console.log('📍 Mock N8N analyze-survey endpoint called');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    // Return a mock successful response
    res.json({
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
  });

  console.log('🧪 Mock N8N endpoints registered: /api/n8n/mock/analyze-sct, /api/n8n/mock/analyze-survey');
};