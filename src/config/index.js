// ============================================================
// src/config/index.js — Configuration centralisée de l'application
// ============================================================
import 'dotenv/config';

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  RENDER_URL: process.env.RENDER_URL || null,
  SUPERADMIN_SECRET: process.env.SUPERADMIN_SECRET || 'WiseDesign2025!',
  PING_INTERVAL_MS: parseInt(process.env.PING_INTERVAL_MS || '720000'),
  ECOSYSTEM_NAME: process.env.ECOSYSTEM_NAME || 'Wise Design Smart Ecosystem',
  IS_RENDER: !!process.env.RENDER_URL,
};
