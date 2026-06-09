import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Helper to map Supabase database fields to match the frontend expectations
const mapTask = (task) => {
  if (!task) return null;
  return {
    _id: task.id,
    title: task.title,
    isCompleted: task.is_completed,
    category: task.category,
    reminderTime: task.reminder_time,
    createdAt: task.created_at,
    updatedAt: task.updated_at
  };
};

// GET /api/tasks -> Fetch all tasks
router.get('/', async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(tasks ? tasks.map(mapTask) : []);
  } catch (error) {
    console.error('❌ Error fetching tasks from Supabase:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

// POST /api/tasks -> Add a new task
router.post('/', async (req, res) => {
  try {
    const { title, category, reminderTime } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert([{ 
        title, 
        category: category || 'Work', 
        reminder_time: reminderTime || null 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapTask(newTask));
  } catch (error) {
    console.error('❌ Error creating task in Supabase:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// PUT /api/tasks/:id -> Update a task status/fields
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, isCompleted, reminderTime } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (isCompleted !== undefined) updateData.is_completed = isCompleted;
    if (reminderTime !== undefined) updateData.reminder_time = reminderTime;
    updateData.updated_at = new Date();

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(mapTask(updatedTask));
  } catch (error) {
    console.error(`❌ Error updating task with ID ${req.params.id} in Supabase:`, error);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

// DELETE /api/tasks/:id -> Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: deletedTask, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully', task: mapTask(deletedTask) });
  } catch (error) {
    console.error(`❌ Error deleting task with ID ${req.params.id} in Supabase:`, error);
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

export default router;
