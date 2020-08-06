import { Pool } from 'pg';

import { SpraxAPIdbCfg } from './global';

export class dbUtils {
  private pool: Pool | null = null;

  constructor(dbCfg: SpraxAPIdbCfg) {
    if (dbCfg.enabled) {
      this.pool = new Pool({
        host: dbCfg.host,
        port: dbCfg.port,
        user: dbCfg.user,
        password: dbCfg.password,
        database: dbCfg.databases.skindb,
        ssl: dbCfg.ssl ? { rejectUnauthorized: false } : false,
        max: dbCfg.connectionPoolSize
      });

      this.pool.on('error', (err, _client) => {
        console.error('Unexpected error on idle client:', err);
      });
    }
  }

  getPool(): Pool | null {
    return this.pool;
  }

  /* Helper */

  isAvailable(): boolean {
    return this.pool != null;
  }

  async isReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.pool == null) return reject();

      this.pool.query('SELECT NOW();')
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  }

  async shutdown(): Promise<void> {
    if (this.pool == null) return new Promise((resolve, _reject) => { resolve(); });

    const result = this.pool.end();
    this.pool = null;

    return result;
  }
}