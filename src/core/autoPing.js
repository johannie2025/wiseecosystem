// ============================================================
// src/core/autoPing.js — Anti-sleep pour Render.com Free Tier
// ============================================================
import { CONFIG } from '../config/index.js';

/**
 * Lance un ping périodique vers sa propre URL publique.
 * S'active uniquement si RENDER_URL est défini dans .env.
 * Empêche l'instance Render Free de passer en veille après 15min.
 */
export function startAutoPing(logger) {
  if (!CONFIG.IS_RENDER || !CONFIG.RENDER_URL) {
    logger.info('[AutoPing] Mode LOCAL — auto-ping désactivé.');
    return;
  }

  const pingUrl = `${CONFIG.RENDER_URL}/health`;
  logger.info(`[AutoPing] Activé → ping toutes les ${CONFIG.PING_INTERVAL_MS / 60000} min vers ${pingUrl}`);

  setInterval(async () => {
    try {
      const res = await fetch(pingUrl, { method: 'GET', signal: AbortSignal.timeout(10000) });
      logger.info(`[AutoPing] ✓ Ping OK — status: ${res.status}`);
    } catch (err) {
      logger.warn(`[AutoPing] ✗ Ping échoué: ${err.message}`);
    }
  }, CONFIG.PING_INTERVAL_MS);
}
