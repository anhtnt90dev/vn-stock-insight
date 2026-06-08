import type { RecommendationAction } from '../domain/types';

export function recommendationActionLabel(action: RecommendationAction): string {
  if (action === 'Buy') return 'Mua';
  if (action === 'Hold') return 'Nắm giữ';
  return 'Tránh/Bán';
}
