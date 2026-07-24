import app from './app';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

dotenv.config();

const port = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server..', error);
  }
};

bootstrap();
