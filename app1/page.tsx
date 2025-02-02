

'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useRouter } from 'next/navigation';

const socket = io('http://localhost:5000'); // Backend URL

interface Note {
  _id: string;
  title: string;
  content: string;
  owner: string;
  sharedWith: string[];
}

interface NewNote {
  title: string;
  content: string;
}

interface EditNote extends NewNote {
  _id: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState<NewNote>({ title: '', content: '' });
  const [editNote, setEditNote] = useState<EditNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Redirect to login if no token is found
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchNotes();
      socket.on('noteUpdated', fetchNotes);
    }
    return () => {
      socket.off('noteUpdated');
    };
  }, [router]);

  // Fetch all notes
  const fetchNotes = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get('http://localhost:5000/api/notes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  // Create a new note
  const handleCreateNote = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post('http://localhost:5000/api/notes', newNote, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewNote({ title: '', content: '' });
      fetchNotes();
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // Update a note
  const handleUpdateNote = async () => {
    if (!editNote) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(`http://localhost:5000/api/notes/${editNote._id}`, editNote, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditNote(null);
      fetchNotes();
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  // Delete a note
  const handleDeleteNote = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Share a note
  const handleShareNote = async (id: string, email: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(`http://localhost:5000/api/notes/${id}/share`, { email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Note shared successfully');
    } catch (err) {
      console.error('Failed to share note:', err);
    }
  };

  // Search notes
  const handleSearch = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get(`http://localhost:5000/api/notes/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data);
    } catch (err) {
      console.error('Failed to search notes:', err);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Notes</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded">
          Logout
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded"
        />
        <button onClick={handleSearch} className="ml-2 bg-blue-500 text-white p-2 rounded">
          Search
        </button>
      </div>

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

      {/* Edit Note Form */}
      {editNote && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Edit Note</h2>
          <input
            type="text"
            placeholder="Title"
            value={editNote.title}
            onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
            className="border p-2 rounded mb-2 w-full"
          />
          <textarea
            placeholder="Content"
            value={editNote.content}
            onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
            className="border p-2 rounded mb-2 w-full"
          />
          <button onClick={handleUpdateNote} className="bg-yellow-500 text-white p-2 rounded">
            Update Note
          </button>
          <button onClick={() => setEditNote(null)} className="bg-gray-500 text-white p-2 rounded ml-2">
            Cancel
          </button>
        </div>
      )}

      {/* Notes List */}
      <div>
        {notes.map((note) => (
          <div key={note._id} className="border p-4 rounded mb-4">
            <h2 className="text-xl font-semibold">{note.title}</h2>
            <p className="text-gray-700">{note.content}</p>
            <div className="mt-2">
              <button
                onClick={() => setEditNote(note)}
                className="bg-yellow-500 text-white p-2 rounded mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteNote(note._id)}
                className="bg-red-500 text-white p-2 rounded mr-2"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  const email = prompt('Enter email to share with:');
                  if (email) handleShareNote(note._id, email);
                }}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// 'use client';

// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import io from 'socket.io-client';

// const socket = io('http://localhost:5000'); // Backend URL

// interface Note {
//   _id: string;
//   title: string;
//   content: string;
//   owner: string;
//   sharedWith: string[];
// }

// interface NewNote {
//   title: string;
//   content: string;
// }

// interface EditNote extends NewNote {
//   _id: string;
// }

// export default function Home() {
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [newNote, setNewNote] = useState<NewNote>({ title: '', content: '' });
//   const [editNote, setEditNote] = useState<EditNote | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');

//   // Fetch notes on component mount
//   useEffect(() => {
//     fetchNotes();
//     socket.on('noteUpdated', fetchNotes);
//     return () => {
//       socket.off('noteUpdated');
//     };
//   }, []);
//   // Fetch all notes
//   const fetchNotes = async () => {
//     const token = localStorage.getItem('token');
//     const res = await axios.get('http://localhost:5000/api/notes', {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setNotes(res.data);
//   };

//   // Create a new note
//   const handleCreateNote = async () => {
//     const token = localStorage.getItem('token');
//     await axios.post('http://localhost:5000/api/notes', newNote, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setNewNote({ title: '', content: '' });
//     fetchNotes();
//   };

//   // Update a note
//   const handleUpdateNote = async () => {
//     if (!editNote) return;
//     const token = localStorage.getItem('token');
//     await axios.put(`http://localhost:5000/api/notes/${editNote._id}`, editNote, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setEditNote(null);
//     fetchNotes();
//   };

//   // Delete a note
//   const handleDeleteNote = async (id: string) => {
//     const token = localStorage.getItem('token');
//     await axios.delete(`http://localhost:5000/api/notes/${id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     fetchNotes();
//   };

//   // Share a note
//   const handleShareNote = async (id: string, email: string) => {
//     const token = localStorage.getItem('token');
//     await axios.post(`http://localhost:5000/api/notes/${id}/share`, { email }, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     alert('Note shared successfully');
//   };

//   // Search notes
//   const handleSearch = async () => {
//     const token = localStorage.getItem('token');
//     const res = await axios.get(`http://localhost:5000/api/notes/search?query=${searchQuery}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setNotes(res.data);
//   };

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">My Notes</h1>

//       {/* Search Bar */}
//       <div className="mb-4">
//         <input
//           type="text"
//           placeholder="Search notes..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="border p-2 rounded"
//         />
//         <button onClick={handleSearch} className="ml-2 bg-blue-500 text-white p-2 rounded">
//           Search
//         </button>
//       </div>

//       {/* Create Note Form */}
//       <div className="mb-4">
//         <h2 className="text-xl font-semibold mb-2">Create New Note</h2>
//         <input
//           type="text"
//           placeholder="Title"
//           value={newNote.title}
//           onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
//           className="border p-2 rounded mb-2 w-full"
//         />
//         <textarea
//           placeholder="Content"
//           value={newNote.content}
//           onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
//           className="border p-2 rounded mb-2 w-full"
//         />
//         <button onClick={handleCreateNote} className="bg-green-500 text-white p-2 rounded">
//           Create Note
//         </button>
//       </div>

//       {/* Edit Note Form */}
//       {editNote && (
//         <div className="mb-4">
//           <h2 className="text-xl font-semibold mb-2">Edit Note</h2>
//           <input
//             type="text"
//             placeholder="Title"
//             value={editNote.title}
//             onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
//             className="border p-2 rounded mb-2 w-full"
//           />
//           <textarea
//             placeholder="Content"
//             value={editNote.content}
//             onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
//             className="border p-2 rounded mb-2 w-full"
//           />
//           <button onClick={handleUpdateNote} className="bg-yellow-500 text-white p-2 rounded">
//             Update Note
//           </button>
//           <button onClick={() => setEditNote(null)} className="bg-gray-500 text-white p-2 rounded ml-2">
//             Cancel
//           </button>
//         </div>
//       )}

//       {/* Notes List */}
//       <div>
//         {notes.map((note) => (
//           <div key={note._id} className="border p-4 rounded mb-4">
//             <h2 className="text-xl font-semibold">{note.title}</h2>
//             <p className="text-gray-700">{note.content}</p>
//             <div className="mt-2">
//               <button
//                 onClick={() => setEditNote(note)}
//                 className="bg-yellow-500 text-white p-2 rounded mr-2"
//               >
//                 Edit
//               </button>
//               <button
//                 onClick={() => handleDeleteNote(note._id)}
//                 className="bg-red-500 text-white p-2 rounded mr-2"
//               >
//                 Delete
//               </button>
//               <button
//                 onClick={() => {
//                   const email = prompt('Enter email to share with:');
//                   if (email) handleShareNote(note._id, email);
//                 }}
//                 className="bg-blue-500 text-white p-2 rounded"
//               >
//                 Share
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
// // // export default function Home() {
// // //   return
// // // }


// // 'use client';

// // import { useEffect, useState } from 'react';
// // import axios from 'axios';
// // import io from 'socket.io-client';

// // const socket = io('http://localhost:5000'); // Backend URL

// // export default function Home() {
// //   const [notes, setNotes] = useState([]);
// //   const [newNote, setNewNote] = useState({ title: '', content: '' });
// //   const [editNote, setEditNote] = useState(null);
// //   const [searchQuery, setSearchQuery] = useState('');

// //   // Fetch notes on component mount
// //   useEffect(() => {
// //     fetchNotes();
// //     socket.on('noteUpdated', fetchNotes); // Listen for real-time updates
// //     return () => socket.off('noteUpdated');
// //   }, []);

// //   // Fetch all notes
// //   const fetchNotes = async () => {
// //     const token = localStorage.getItem('token');
// //     const res = await axios.get('http://localhost:5000/api/notes', {
// //       headers: { Authorization: `Bearer ${token}` },
// //     });
// //     setNotes(res.data);
// //   };

// //   // Create a new note
// //   const handleCreateNote = async () => {
// //     const token = localStorage.getItem('token');
// //     await axios.post('http://localhost:5000/api/notes', newNote, {
// //       headers: { Authorization: `Bearer ${token}` },
// //     });
// //     setNewNote({ title: '', content: '' });
// //     fetchNotes();
// //   };

// //   // Update a note
// //   const handleUpdateNote = async () => {
// //     const token = localStorage.getItem('token');
// //     await axios.put(`http://localhost:5000/api/notes/${editNote._id}`, editNote, {
// //       headers: { Authorization: `Bearer ${token}` },
// //     });
// //     setEditNote(null);
// //     fetchNotes();
// //   };

// //   // Delete a note
// //   const handleDeleteNote = async (id) => {
// //     const token = localStorage.getItem('token');
// //     await axios.delete(`http://localhost:5000/api/notes/${id}`, {
// //       headers: { Authorization: `Bearer ${token}` },
// //     });
// //     fetchNotes();
// //   };

// //   // Share a note
// //   const handleShareNote = async (id, email) => {
// //     const token = localStorage.getItem('token');
// //     await axios.post(`http://localhost:5000/api/notes/${id}/share`, { email }, {
// //       headers: { Authorization: `Bearer ${token}` },
// //     });
// //     alert('Note shared successfully');
// //   };

// //   // Search notes
// //   const handleSearch = async () => {
// //     const token = localStorage.getItem('token');
// //     const res = await axios.get(`http://localhost:5000/api/notes/search?query=${searchQuery}`, {
// //       headers: { Authorization: `Bearer ${token}` },
// //     });
// //     setNotes(res.data);
// //   };

// //   return (
// //     <div className="p-4">
// //       <h1 className="text-2xl font-bold mb-4">My Notes</h1>

// //       {/* Search Bar */}
// //       <div className="mb-4">
// //         <input
// //           type="text"
// //           placeholder="Search notes..."
// //           value={searchQuery}
// //           onChange={(e) => setSearchQuery(e.target.value)}
// //           className="border p-2 rounded"
// //         />
// //         <button onClick={handleSearch} className="ml-2 bg-blue-500 text-white p-2 rounded">
// //           Search
// //         </button>
// //       </div>

// //       {/* Create Note Form */}
// //       <div className="mb-4">
// //         <h2 className="text-xl font-semibold mb-2">Create New Note</h2>
// //         <input
// //           type="text"
// //           placeholder="Title"
// //           value={newNote.title}
// //           onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
// //           className="border p-2 rounded mb-2 w-full"
// //         />
// //         <textarea
// //           placeholder="Content"
// //           value={newNote.content}
// //           onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
// //           className="border p-2 rounded mb-2 w-full"
// //         />
// //         <button onClick={handleCreateNote} className="bg-green-500 text-white p-2 rounded">
// //           Create Note
// //         </button>
// //       </div>

// //       {/* Edit Note Form */}
// //       {editNote && (
// //         <div className="mb-4">
// //           <h2 className="text-xl font-semibold mb-2">Edit Note</h2>
// //           <input
// //             type="text"
// //             placeholder="Title"
// //             value={editNote.title}
// //             onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
// //             className="border p-2 rounded mb-2 w-full"
// //           />
// //           <textarea
// //             placeholder="Content"
// //             value={editNote.content}
// //             onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
// //             className="border p-2 rounded mb-2 w-full"
// //           />
// //           <button onClick={handleUpdateNote} className="bg-yellow-500 text-white p-2 rounded">
// //             Update Note
// //           </button>
// //           <button onClick={() => setEditNote(null)} className="bg-gray-500 text-white p-2 rounded ml-2">
// //             Cancel
// //           </button>
// //         </div>
// //       )}

// //       {/* Notes List */}
// //       <div>
// //         {notes.map((note) => (
// //           <div key={note._id} className="border p-4 rounded mb-4">
// //             <h2 className="text-xl font-semibold">{note.title}</h2>
// //             <p className="text-gray-700">{note.content}</p>
// //             <div className="mt-2">
// //               <button
// //                 onClick={() => setEditNote(note)}
// //                 className="bg-yellow-500 text-white p-2 rounded mr-2"
// //               >
// //                 Edit
// //               </button>
// //               <button
// //                 onClick={() => handleDeleteNote(note._id)}
// //                 className="bg-red-500 text-white p-2 rounded mr-2"
// //               >
// //                 Delete
// //               </button>
// //               <button
// //                 onClick={() => {
// //                   const email = prompt('Enter email to share with:');
// //                   if (email) handleShareNote(note._id, email);
// //                 }}
// //                 className="bg-blue-500 text-white p-2 rounded"
// //               >
// //                 Share
// //               </button>
// //             </div>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }

