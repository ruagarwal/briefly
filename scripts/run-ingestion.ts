/**
 * Standalone ingestion runner for GitHub Actions & CI cron jobs
 */
process.env.INGEST_ONLY = 'true';
import('../server.ts');
