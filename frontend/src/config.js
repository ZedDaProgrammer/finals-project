/**
 * Shared application configuration
 * OPTIMIZATION #11: Centralized API_URL to avoid duplication across 7+ files
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
