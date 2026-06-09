import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Helper to map DB daily task to frontend format
const mapDailyTask = (task) => ({
  _id: task.id,
  title: task.title,
  createdAt: task.created_at
});

// Helper to map DB log to frontend format
const mapLog = (log) => ({
  _id: log.id,
  dailyTaskId: log.daily_task_id,
  completedDate: log.completed_date,
  isCompleted: log.is_completed
});

// GET /api/daily-tasks -> Fetch all habits and their logs
router.get('/', async (req, res) => {
  try {
    // 1. Fetch habits
    const { data: tasks, error: tasksErr } = await supabase
      .from('daily_tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (tasksErr) throw tasksErr;

    // 2. Fetch logs
    const { data: logs, error: logsErr } = await supabase
      .from('daily_task_logs')
      .select('*')
      .order('completed_date', { ascending: false });

    if (logsErr) throw logsErr;

    res.json({
      tasks: tasks ? tasks.map(mapDailyTask) : [],
      logs: logs ? logs.map(mapLog) : []
    });
  } catch (error) {
    console.error('❌ Error fetching daily tasks:', error);
    res.status(500).json({ error: 'Server error fetching daily tasks' });
  }
});

// POST /api/daily-tasks -> Create a new daily task habit
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data: newTask, error } = await supabase
      .from('daily_tasks')
      .insert([{ title }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapDailyTask(newTask));
  } catch (error) {
    console.error('❌ Error creating daily task:', error);
    res.status(500).json({ error: 'Server error creating daily task' });
  }
});

// POST /api/daily-tasks/toggle -> Toggle completion status for a specific day
router.post('/toggle', async (req, res) => {
  try {
    const { dailyTaskId, date, isCompleted } = req.body;
    if (!dailyTaskId || !date) {
      return res.status(400).json({ error: 'dailyTaskId and date are required' });
    }

    // Check if a log entry already exists
    const { data: existingLog, error: fetchErr } = await supabase
      .from('daily_task_logs')
      .select('*')
      .eq('daily_task_id', dailyTaskId)
      .eq('completed_date', date)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    let resultLog;
    if (existingLog) {
      // If it exists, update the completion status
      const { data: updatedLog, error: updateErr } = await supabase
        .from('daily_task_logs')
        .update({ is_completed: isCompleted })
        .eq('id', existingLog.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      resultLog = updatedLog;
    } else {
      // If not, insert a new entry
      const { data: insertedLog, error: insertErr } = await supabase
        .from('daily_task_logs')
        .insert([{
          daily_task_id: dailyTaskId,
          completed_date: date,
          is_completed: isCompleted
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;
      resultLog = insertedLog;
    }

    res.json(mapLog(resultLog));
  } catch (error) {
    console.error('❌ Error toggling daily task status:', error);
    res.status(500).json({ error: 'Server error toggling daily task status' });
  }
});

// DELETE /api/daily-tasks/:id -> Delete a habit and its cascade logs
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: deletedTask, error } = await supabase
      .from('daily_tasks')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!deletedTask) {
      return res.status(404).json({ error: 'Daily task not found' });
    }

    res.json({ message: 'Daily task deleted successfully', task: mapDailyTask(deletedTask) });
  } catch (error) {
    console.error('❌ Error deleting daily task:', error);
    res.status(500).json({ error: 'Server error deleting daily task' });
  }
});

export default router;
