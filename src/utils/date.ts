/** Same short format used for product reviews, kept in one place so any
 * screen showing a review/testimonial date reads consistently. */
export function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}
