import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import analysisRoutes from './routes/analysis.routes';

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1', analysisRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'active', timestamp: new Date().toISOString() });
});

export default app;
