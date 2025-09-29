// This component helps improve UI display
import React from 'react';

/**
 * Analysis header component with magnifying glass icon
 */
export const AnalysisHeader = () => (
  <h6 className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground dark:text-foreground">
    <span>🔍</span> Analysis:
  </h6>
);

/**
 * Consistent background style for survey/case analysis panels
 */
export const analysisCardClasses = "border-l-4 border-l-primary pl-4 py-3 bg-background/50 dark:bg-background/80 rounded-r-lg shadow-sm border border-border/50";

/**
 * Improved formatter for removing double bullets
 */
export const formatRecommendationText = (text: string): string => {
  // If text is empty, return empty string
  if (!text) return '';
  
  // First handle the common case: items that start with "• " 
  let cleaned = text.replace(/^\s*•\s+/gm, '');
  
  // Then handle other bullet characters (if the first replacement didn't work)
  if (cleaned === text) {
    cleaned = text.replace(/^\s*[-*]\s+/gm, '');
  }
  
  return cleaned;
};