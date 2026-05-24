/**
 * Calculate discount tier based on user points
 * OPTIMIZATION: Extracted to avoid duplication across multiple booking functions
 * @param {number} points - User's current points
 * @returns {object} { rate: discount rate (0-1), rank: rank name }
 */
const getDiscountTier = (points) => {
    if (points >= 350) return { rate: 0.15, rank: "Radiant" };
    if (points >= 175) return { rate: 0.10, rank: "Platinum" };
    if (points >= 75) return { rate: 0.06, rank: "Gold" };
    if (points >= 25) return { rate: 0.03, rank: "Silver" };
    return { rate: 0, rank: "Bronze" };
};

module.exports = { getDiscountTier };
