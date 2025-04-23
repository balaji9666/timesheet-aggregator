import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import workflowRoutes from './routes/workflow.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const port: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet({
  // Configure helmet for cloud environment
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.render.com", "https://*.amazonaws.com"]
    }
  }
}));

// Enable CORS with proper configuration for cloud environment
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://timesheet-aggregator-eind.onrender.com',
    'https://*.render.com',
    'https://*.amazonaws.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Trust proxy headers (important for cloud environment)
app.set('trust proxy', 1);

// Routes
app.use('/api/workflow', workflowRoutes);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Basic error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Basic API route
app.get('/api/hello', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Workflow Timesheet Aggregator!' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Workflow Timesheet Aggregator - Route not found'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Workflow Timesheet Aggregator API is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}); 