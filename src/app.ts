import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import globalErrorHandler from './middlewares/globalErrorHandler';
import responseMiddleware from './middlewares/response.middleware';
import mainRouter from './routes/index.routes';
import swaggerSpec from './utils/swagger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseMiddleware);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', mainRouter);
app.get('/', (_req, res) => {
  res.send('Tapsy Backend is running!');
});

app.use(globalErrorHandler);

export default app;
