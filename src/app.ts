import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import globalErrorHandler from './middlewares/globalErrorHandler';
import responseMiddleware from './middlewares/response.middleware';
import mainRouter from './routes/index.routes';
import swaggerSpec, { getSwaggerSpec } from './utils/swagger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseMiddleware);

// Health check endpoint for ECS
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Tapsy Backend is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
    const freshSpec = getSwaggerSpec();
    swaggerUi.setup(freshSpec)(req, res, next);
  });
} else {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
app.use('/api', mainRouter);
app.get('/', (_req, res) => {
  res.json({
    message: 'Tapsy Backend is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use(globalErrorHandler);

export default app;
