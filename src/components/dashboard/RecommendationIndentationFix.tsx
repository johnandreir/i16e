import React, { useEffect } from 'react';

/**
 * Component that adds a style tag to the document head to fix recommendation indentation
 */
export const RecommendationIndentationFix = () => {
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    
    // Add CSS rules to fix indentation
    styleElement.textContent = `
      /* Target recommendation divs based on their structure */
      .text-accent + :contains("Recommendations") ~ div,
      div:has(> .text-accent):contains("Recommendations") + div {
        margin-left: 1.5rem !important; /* ml-6 equivalent */
      }
      
      /* Target recommendation lists to match analysis bullets */
      div:has(> .text-accent):contains("Recommendations") + div ul {
        margin-left: 1rem !important;
        list-style-type: disc !important;
      }
    `;
    
    // Append the style element to head
    document.head.appendChild(styleElement);
    
    // Clean up when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default RecommendationIndentationFix;