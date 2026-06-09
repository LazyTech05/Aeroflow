import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Helper to map Supabase database fields to match the frontend expectations
const mapNote = (note) => {
  if (!note) return null;
  return {
    _id: note.id,
    title: note.title,
    content: note.content,
    imageUrl: note.image_url || '',
    createdAt: note.created_at
  };
};

// GET /api/notes -> Fetch all raw notes
router.get('/', async (req, res) => {
  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(notes ? notes.map(mapNote) : []);
  } catch (error) {
    console.error('❌ Error fetching notes from Supabase:', error);
    res.status(500).json({ error: 'Server error fetching notes' });
  }
});

// POST /api/notes -> Save a brand new raw text note
router.post('/', async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const { data: newNote, error } = await supabase
      .from('notes')
      .insert([{ 
        title, 
        content, 
        image_url: imageUrl || '' 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapNote(newNote));
  } catch (error) {
    console.error('❌ Error saving note in Supabase:', error);
    res.status(500).json({ error: 'Server error saving note' });
  }
});

// PUT /api/notes/:id -> Update an existing note canvas
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, imageUrl } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;

    const { data: updatedNote, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(mapNote(updatedNote));
  } catch (error) {
    console.error(`❌ Error updating note with ID ${req.params.id} in Supabase:`, error);
    res.status(500).json({ error: 'Server error updating note' });
  }
});

// DELETE /api/notes/:id -> Delete a note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: deletedNote, error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!deletedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ message: 'Note deleted successfully', note: mapNote(deletedNote) });
  } catch (error) {
    console.error(`❌ Error deleting note with ID ${req.params.id} in Supabase:`, error);
    res.status(500).json({ error: 'Server error deleting note' });
  }
});

export default router;
