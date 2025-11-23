import dotenv from 'dotenv';
import connectDB from './config/database.js';
import app from './app.js';
import { startCronJobs } from './services/cronService.js';

dotenv.config();

const PORT = process.env.PORT || 5000; // Default to 5000 to match frontend expectation

connectDB();

startCronJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

