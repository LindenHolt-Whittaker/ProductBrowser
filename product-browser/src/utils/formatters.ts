/**
 * Generate star rating display
 */
export const formatRating = (rating: number): { stars: string; value: string } => {
  const roundedRating = Math.round(rating);
  const stars = '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating);
  const value = rating.toFixed(1);
  
  return { stars, value };
};