// Fixed n8n code node to include NEUTRAL surveys
// Get the survey data from the correct path: body.survey_data
const inputData = $input.all()[0].json;
const surveyData = inputData.body.survey_data || [];

console.log("Survey data found:", surveyData.length, "items");

// Separate DSAT, CSAT, and NEUTRAL surveys
const dsatSurveys = surveyData.filter(survey => survey.category === 'dsat');
const csatSurveys = surveyData.filter(survey => survey.category === 'csat');
const neutralSurveys = surveyData.filter(survey => survey.category === 'neut' || survey.category === 'neutral');

console.log("DSAT surveys:", dsatSurveys.length);
console.log("CSAT surveys:", csatSurveys.length);
console.log("NEUTRAL surveys:", neutralSurveys.length);

// Select surveys from each category (adjust numbers as needed)
const selectedDsat = dsatSurveys.slice(0, 3);
const selectedCsat = csatSurveys.slice(0, 2);
const selectedNeutral = neutralSurveys.slice(0, 2); // Include 2 neutral surveys

// Combine selected surveys
const selectedSurveys = [...selectedDsat, ...selectedCsat, ...selectedNeutral];

// Extract unique case IDs for MongoDB lookup
const caseIds = [...new Set(selectedSurveys.map(survey => survey.case_id))];

// Format case_ids with quotes for MongoDB
const formattedCaseIds = caseIds.map(id => `"${id}"`).join(',');

return [{
  json: {
    selected_surveys: selectedSurveys,
    case_ids: formattedCaseIds,
    dsat_count: selectedDsat.length,
    csat_count: selectedCsat.length,
    neutral_count: selectedNeutral.length, // Add neutral count
    total_surveys: selectedSurveys.length,
    entity_type: inputData.body.entity_type,
    entity_name: inputData.body.entity_name,
    debug_total_input: surveyData.length,
    debug_breakdown: {
      dsat: selectedDsat.length,
      csat: selectedCsat.length, 
      neutral: selectedNeutral.length
    }
  }
}];