import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import workflowRoutes from './routes/workflow.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const port: number = parseInt(process.env.PORT || '3000', 10);

// SSL Certificate configuration
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/private.key')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/certificate.crt'))
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: ['http://localhost:4200', 'https://timesheet-aggregator-eind.onrender.com', 'timesheet-aggregator-eind.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
})); // Enable CORS
app.use(morgan('dev')); // Logging  
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);

// Start server
httpsServer.listen(port, () => {
  console.log(`Workflow Timesheet Aggregator API is running securely on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}); 