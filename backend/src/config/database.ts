import pg from 'pg';
import { QueryResult } from 'pg';
import { config } from './index.ts';

const { Pool } = pg;
// Configure pg to return DATE columns as plain strings to prevent timezone shifts
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

function getSslConfig(host?: string, connStr?: string): boolean | { rejectUnauthorized: boolean } {
    if (process.env.DB_SSL === 'false' || process.env.DB_SSL === '0') {
        return false;
    }
    if (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') {
        return { rejectUnauthorized: false };
    }

    const h = (host || '').toLowerCase();
    const isLocal = !h || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');

    if (connStr) {
        if (connStr.includes('sslmode=disable') || connStr.includes('ssl=false')) {
            return false;
        }
        if (connStr.includes('sslmode=require') || connStr.includes('ssl=true')) {
            return { rejectUnauthorized: false };
        }
    }

    if (isLocal) {
        return false;
    }

    return { rejectUnauthorized: false };
}

function buildPoolConfig(): pg.PoolConfig {
    let connStr = (process.env.DATABASE_URL || '').replace(/^jdbc:/, '').trim();
    const fallbackUser = process.env.DB_USER || config.database.user || 'neondb_owner';
    const fallbackPassword = process.env.DB_PASSWORD || config.database.password || 'npg_ho9GCEpdely8';
    const fallbackHost = process.env.DB_HOST || config.database.host || 'ep-holy-cloud-aotyzmig-pooler.c-2.ap-southeast-1.aws.neon.tech';
    const fallbackPort = parseInt(process.env.DB_PORT || String(config.database.port || 5432), 10);
    const fallbackDatabase = process.env.DB_NAME || config.database.database || 'neondb';

    if (connStr) {
        try {
            if (!connStr.startsWith('postgres://') && !connStr.startsWith('postgresql://')) {
                connStr = 'postgresql://' + connStr;
            }
            const parsed = new URL(connStr);
            if (!parsed.username && fallbackUser) parsed.username = fallbackUser;
            if (!parsed.password && fallbackPassword) parsed.password = fallbackPassword;
            if (!parsed.hostname && fallbackHost) parsed.hostname = fallbackHost;
            if (!parsed.pathname || parsed.pathname === '/') parsed.pathname = '/' + fallbackDatabase;

            const ssl = getSslConfig(parsed.hostname, connStr);

            return {
                connectionString: parsed.toString(),
                ssl: ssl || false,
            };
        } catch (err) {
            console.warn('[database] Failed to parse DATABASE_URL, falling back to explicit fields:', err);
        }
    }

    const ssl = getSslConfig(fallbackHost);
    return {
        user: fallbackUser,
        password: fallbackPassword,
        host: fallbackHost,
        port: fallbackPort,
        database: fallbackDatabase,
        ssl: ssl || false,
    };
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client:', err);
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`Executed query in ${duration}ms`, { text, params });
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

export const getClient = async () => {
    return pool.connect();
};

export default pool;
