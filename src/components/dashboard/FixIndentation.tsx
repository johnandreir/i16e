import React, { useEffect } from 'react';

/**
 * React component to fix the indentation in the ImprovedInsightsPanel
 * This injects a script that runs on the client side to fix the alignment
 */
const FixIndentation = () => {
  useEffect(() => {
    // Function to fix recommendation indentation
    const fixIndentation = () => {
      // Find all recommendation headers
      const recommendationHeaders = document.querySelectorAll('h6:has(.h-4.w-4.text-accent)');
      
      // For each header, find the next div (content container) and add margin-left
      recommendationHeaders.forEach(header => {
        const contentDiv = header.nextElementSibling;
        if (contentDiv && contentDiv.tagName === 'DIV') {
          contentDiv.style.marginLeft = '1.5rem'; // ml-6 equivalent
        }
      });
    };

    // Run initially and set up an observer to handle dynamic content
    fixIndentation();
    
    // Set up a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(fixIndentation);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Cleanup
    return () => observer.disconnect();
  }, []);

  return null; // This component doesn't render anything
};

export default FixIndentation;