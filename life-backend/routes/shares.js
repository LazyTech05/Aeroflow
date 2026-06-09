import express from 'express';
import crypto from 'crypto';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Helper to map Supabase note fields to match the frontend expectations
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

// POST /api/shares -> Generate a cryptographically secure share link bundle
router.post('/', async (req, res) => {
  try {
    const { noteIds } = req.body;
    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ error: 'At least one note ID is required to share' });
    }

    // Verify all noteIds exist in database
    const { data: validNotes, error: fetchErr } = await supabase
      .from('notes')
      .select('id')
      .in('id', noteIds);

    if (fetchErr) throw fetchErr;

    if (!validNotes || validNotes.length !== noteIds.length) {
      return res.status(400).json({ error: 'One or more of the specified notes do not exist' });
    }

    // Generate secure uuid for routing
    const shareId = crypto.randomUUID();

    const { data: newBundle, error: insertErr } = await supabase
      .from('share_bundles')
      .insert([{
        share_id: shareId,
        shared_notes: noteIds
      }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json({ shareId: newBundle.share_id });
  } catch (error) {
    console.error('❌ Error generating share bundle in Supabase:', error);
    res.status(500).json({ error: 'Server error generating share link' });
  }
});

// GET /api/shares/:shareId -> Public endpoint to fetch populated bundle contents
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    
    // Fetch the share bundle
    const { data: bundle, error: bundleErr } = await supabase
      .from('share_bundles')
      .select('*')
      .eq('share_id', shareId)
      .maybeSingle();

    if (bundleErr || !bundle) {
      return res.status(404).json({ error: 'Shared link not found or expired' });
    }

    // If there are no notes, return empty
    if (!bundle.shared_notes || bundle.shared_notes.length === 0) {
      return res.json([]);
    }

    // Fetch and populate notes in the bundle
    const { data: notes, error: notesErr } = await supabase
      .from('notes')
      .select('id, title, content, image_url, created_at')
      .in('id', bundle.shared_notes);

    if (notesErr) throw notesErr;

    // Return the notes mapped back to frontend expectations
    res.json(notes ? notes.map(mapNote) : []);
  } catch (error) {
    console.error(`❌ Error fetching shared bundle with ID ${req.params.shareId} in Supabase:`, error);
    res.status(500).json({ error: 'Server error retrieving shared notes' });
  }
});

export default router;
