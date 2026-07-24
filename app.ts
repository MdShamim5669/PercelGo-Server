import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { notFound } from './module/middleware/notFoundMiddleware';
import { globalErrorHandler } from './module/middleware/globalErrorHandler';
import { IndexRoutes } from './module/routes';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// =================Routes=====================
app.use("/api/v1", IndexRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('PerCelGo Server is running successfully with MVC architecture.');
});

app.use(notFound);

app.use(globalErrorHandler);

export default app;