import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';
import taskRoutes from './routes/tasks.js';
import noteRoutes from './routes/notes.js';
import shareRoutes from './routes/shares.js';
import dailyTaskRoutes from './routes/dailyTasks.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/daily-tasks', dailyTaskRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task & Note REST API backend is active' });
});

// Test Supabase connection
supabase.from('tasks').select('id').limit(1)
  .then(() => {
    console.log('🚀 Successfully connected to Supabase PostgreSQL!');
  })
  .catch((error) => {
    console.error('❌ Supabase Connection Error:', error);
  });

// Start Express server
app.listen(PORT, () => {
  console.log(`📡 Server is running on port ${PORT}`);
});
