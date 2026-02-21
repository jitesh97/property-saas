/**
 * Get energy rating badge color based on rating
 */
export function getEnergyRatingColor(rating: string): string {
  switch (rating?.toUpperCase()) {
    case 'A':
      return 'bg-green-600 text-white';
    case 'B':
      return 'bg-green-500 text-white';
    case 'C':
      return 'bg-yellow-400 text-black';
    case 'D':
      return 'bg-orange-400 text-black';
    case 'E':
      return 'bg-red-500 text-white';
    case 'F':
      return 'bg-red-600 text-white';
    case 'G':
      return 'bg-red-800 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

/**
 * Get energy rating badge color with black text for area statistics
 */
export function getEnergyRatingColorWithBlackText(rating: string): string {
  switch (rating?.toUpperCase()) {
    case 'A':
      return 'bg-green-600 text-black';
    case 'B':
      return 'bg-green-500 text-black';
    case 'C':
      return 'bg-yellow-400 text-black';
    case 'D':
      return 'bg-orange-400 text-black';
    case 'E':
      return 'bg-red-500 text-black';
    case 'F':
      return 'bg-red-600 text-black';
    case 'G':
      return 'bg-red-800 text-black';
    default:
      return 'bg-gray-500 text-black';
  }
}

/**
 * Get energy rating description
 */
export function getEnergyRatingDescription(rating: string): string {
  switch (rating?.toUpperCase()) {
    case 'A':
      return 'Very Efficient (92+)';
    case 'B':
      return 'Efficient (81-91)';
    case 'C':
      return 'Fairly Efficient (69-80)';
    case 'D':
      return 'Average (55-68)';
    case 'E':
      return 'Inefficient (39-54)';
    case 'F':
      return 'Poor (21-38)';
    case 'G':
      return 'Very Poor (1-20)';
    default:
      return 'Unknown Rating';
  }
}