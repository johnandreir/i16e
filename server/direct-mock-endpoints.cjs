// Direct mock endpoints for n8n workflows
module.exports = function(app) {
  // Shared response handler for SCT analysis
  const handleSCTAnalysis = (req, res) => {
    console.log('📍 Mock N8N analyze-sct endpoint called');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    // Return a mock successful response
    res.json({
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
  
  // Shared response handler for survey analysis
  const handleSurveyAnalysis = (req, res) => {
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
  };

  // Register both webhook and mock paths for analyze-sct
  app.post('/api/n8n/webhook/analyze-sct', handleSCTAnalysis);
  app.post('/api/n8n/mock/analyze-sct', handleSCTAnalysis);
  
  // Register both webhook and mock paths for analyze-survey
  app.post('/api/n8n/webhook/analyze-survey', handleSurveyAnalysis);
  app.post('/api/n8n/mock/analyze-survey', handleSurveyAnalysis);

  console.log('🧪 Added mock n8n endpoints with both webhook and mock paths');
};