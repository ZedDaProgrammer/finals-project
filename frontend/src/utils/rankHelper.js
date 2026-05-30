/**
 * Shared rank/tier utility for the frontend
 * OPTIMIZATION #12: Extracted from Sidebar, ProfilePage, and ReservationPage to eliminate 3x duplication
 */

/**
 * Get rank visual details (name, color, glow) from points
 * Used by: Sidebar, ProfilePage avatar badge
 */
export const getRankDetails = (pts) => {
    if (pts >= 350) return { name: 'Radiant', color: '#ff4757', glow: 'rgba(255, 71, 87, 0.4)' };
    if (pts >= 175) return { name: 'Platinum', color: '#3be8ff', glow: 'rgba(59, 232, 255, 0.4)' };
    if (pts >= 75) return { name: 'Gold', color: '#ffa502', glow: 'rgba(255, 165, 2, 0.4)' };
    if (pts >= 25) return { name: 'Silver', color: '#a4b0be', glow: 'rgba(164, 176, 190, 0.4)' };
    return { name: 'Bronze', color: '#ff7f50', glow: 'rgba(255, 127, 80, 0.3)' };
};

/**
 * Get rank progress towards next tier
 * Used by: ProfilePage loyalty progress bar
 */
export const getRankProgress = (pts) => {
    let currentTier = 'Bronze';
    let nextTier = 'Silver';
    let minPts = 0;
    let maxPts = 25;

    if (pts >= 350) {
        currentTier = 'Radiant';
        nextTier = null;
        minPts = 350;
        maxPts = 350;
    } else if (pts >= 175) {
        currentTier = 'Platinum';
        nextTier = 'Radiant';
        minPts = 175;
        maxPts = 350;
    } else if (pts >= 75) {
        currentTier = 'Gold';
        nextTier = 'Platinum';
        minPts = 75;
        maxPts = 175;
    } else if (pts >= 25) {
        currentTier = 'Silver';
        nextTier = 'Gold';
        minPts = 25;
        maxPts = 75;
    }

    const range = maxPts - minPts;
    const progress = range > 0 ? Math.min(100, Math.max(0, ((pts - minPts) / range) * 100)) : 100;
    const ptsNeeded = nextTier ? maxPts - pts : 0;

    return { currentTier, nextTier, progress, ptsNeeded };
};

/**
 * Get discount tier from points (mirrors backend discountHelper.js)
 * Used by: ReservationPage booking modal
 */
export const getDiscountTier = (points) => {
    if (points >= 350) return { rate: 0.15, rank: 'Radiant' };
    if (points >= 175) return { rate: 0.10, rank: 'Platinum' };
    if (points >= 75) return { rate: 0.06, rank: 'Gold' };
    if (points >= 25) return { rate: 0.03, rank: 'Silver' };
    return { rate: 0, rank: 'Bronze' };
};
