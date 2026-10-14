import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || 'neondb_owner',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        
    },
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:8080',
            ...([process.env.FRONTEND_URL, process.env.CORS_ORIGIN]
                .filter(Boolean)
                .flatMap((val) => (val as string).split(','))
                .map((s) => s.trim().replace(/\/$/, ''))
                .filter(Boolean)),
        ],
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE || '7d',
    },
};
