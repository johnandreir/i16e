/**export const formatRecommendation = (text: string): string => {
  // If text is empty, return empty string
  if (!text) return '';
  
  // First handle the most common bullet character: •
  let cleaned = text.replace(/^\s*•\s+/gm, '');
  
  // If no change was made, try other bullet characters
  if (cleaned === text) {
    cleaned = text.replace(/^\s*[-*]\s+/gm, '');
  }
  
  return cleaned;s function helps render recommendation text and removes double bullets.
 * It will be used to process the recommendation text before it's displayed.
 */
export const formatRecommendation = (text: string): string => {
  // If text is empty, return empty string
  if (!text) return '';
  
  // Remove any leading bullet points to avoid double bullets
  // This will handle • and other bullet characters
  return text.replace(/^\s*[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25B8\u25B9\u25BA\u25BB\u25CB\u25CF\u25D8\u25D9\u25FE\u2605\u2606\*\-•]\s*/gm, '');
}

/**
 * This function checks if text contains bullet characters.
 */
export const containsBullets = (text: string): boolean => {
  if (!text) return false;
  const bulletChars = ['\u2022', '\u2023', '\u25E6', '\u2043', '\u2219', '\u25AA', '\u25AB', '-', '*'];
  return bulletChars.some(bullet => text.includes(bullet + ' '));
}
