import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const PinIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M12 17v5M9 3h6l-1 7h4l-6 7-6-7h4z" />
  </svg>
);

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', pinned: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const n = await api.notes.list();
    setNotes(n ?? []);
  }

  useEffect(() => { load().catch(console.error); }, []);

  function openNew() {
    setSelected('new');
    setError('');
    setForm({ title: '', body: '', pinned: false });
  }

  function openEdit(note) {
    setSelected(note);
    setForm({
      title: note.title,
      body: note.body,
      pinned: note.pinned,
    });
    setError('');
  }

  async function handleSave(e) {
    e?.preventDefault();
    if (!form.title.trim()) {
      setError('Give the note a title before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = { ...form };
      if (selected === 'new') {
        await api.notes.create(body);
      } else {
        await api.notes.update(selected.id, body);
      }
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.message || 'Could not save note');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (selected && selected !== 'new') {
      try {
        await api.notes.remove(selected.id);
        setSelected(null);
        await load();
      } catch (err) {
        setError(err.message || 'Could not delete note');
      }
    }
  }

  async function togglePin(note) {
    try {
      await api.notes.update(note.id, {
        title: note.title,
        body: note.body,
        pinned: !note.pinned,
      });
      await load();
    } catch (err) {
      setError(err.message || 'Could not update note');
    }
  }

  return (
    <div className="notes-page">
      <header className="notes-header">
        <h1>Notes</h1>
        <button className="btn-accent" onClick={openNew}>+ New note</button>
      </header>

      {notes.length === 0 && !selected && (
        <p className="notes-empty">No notes yet. Create one to capture lecture ideas or reminders.</p>
      )}

      <div className="notes-grid">
        {notes.map((n) => {
          return (
            <div
              key={n.id}
              className={`note-card ${n.pinned ? 'pinned' : ''}`}
              onClick={() => openEdit(n)}
            >
              <div className="note-card-head">
                <h3>{n.title}</h3>
                <button
                  className="note-pin"
                  onClick={(e) => { e.stopPropagation(); togglePin(n); }}
                  title={n.pinned ? 'Unpin' : 'Pin'}
                >
                  <PinIcon filled={n.pinned} />
                </button>
              </div>
              <p className="note-card-body">{n.body}</p>
              <div className="note-card-foot">
                <span className="note-date">
                  {new Date(n.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="note-editor-overlay" onClick={() => setSelected(null)}>
          <form
            className="note-editor"
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {error && <div className="form-error">{error}</div>}
            <input
              className="note-editor-title"
              placeholder="Note title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="note-editor-body"
              placeholder="Write your note..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={10}
            />
            <div className="note-editor-meta">
              <label className="note-pin-toggle">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                />
                Pinned
              </label>
            </div>
            <div className="note-editor-actions">
              {selected !== 'new' && (
                <button type="button" className="btn-danger" onClick={handleDelete}>Delete</button>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
              <button
                type="button"
                className="btn-accent note-save-btn"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
