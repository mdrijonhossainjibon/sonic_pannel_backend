import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { accessRoutes } from './routes/access';
import { initRoutes } from './routes/init';
import { createTaskRoutes } from './routes/createTask';
import { welcomeRoutes } from './routes/welcome';
import { apiKeyRoutes } from './routes/apiKey';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
 

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:secret@localhost:27017/AdminHub?authSource=admin';

/* ------------------ Server ------------------ */
const app: Express = express();

/* ------------------ Middleware ------------------ */

app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));   

/* ------------------ Routes ------------------ */
app.use('/api', welcomeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/init', initRoutes);
app.use('/createTask', createTaskRoutes);
app.use('/api/api_key', apiKeyRoutes);

/* ------------------ Error Handler ------------------ */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

/* ------------------ Start Server ------------------ */
async function start() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Database connected successfully');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

start();
