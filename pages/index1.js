
import { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const socket = io('http://localhost:5000');

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [editNote, setEditNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchNotes();
    socket.on('noteUpdated', fetchNotes);
    return () => socket.off('noteUpdated');
  }, []);

  const fetchNotes = async () => {
    const token = localStorage.getItem('token');
    const host = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:5000';
    const res = await axios.get(`${host}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotes(res.data);
  };

  const handleSearch = async () => {
    const token = localStorage.getItem('token');
    const host = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:5000';

    const res = await axios.get(`${host}/api/notes/search?query=${searchQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotes(res.data);
  };

   // Create a new note
   const handleCreateNote = async () => {
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/notes', newNote, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNewNote({ title: '', content: '' });
    fetchNotes();
  };

  
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(notes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setNotes(items);
  };

  return (
    <div>
      <h1>My Notes</h1>
      <input
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="notes">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {notes.map((note, index) => (
                <Draggable key={note._id} draggableId={note._id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <h2>{note.title}</h2>
                      <p>{note.content}</p>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
       {/* Create Note Form */}
       <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Create New Note</h2>
        <input
          type="text"
          placeholder="Title"
          value={newNote.title}
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
          className="border p-2 rounded mb-2 w-full"
        />
        <textarea
          placeholder="Content"
          value={newNote.content}
          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
          className="border p-2 rounded mb-2 w-full"
        />
        <button onClick={handleCreateNote} className="bg-green-500 text-white p-2 rounded">
          Create Note
        </button>
      </div>
    </div>

    
  );
}