import React, { useState, useEffect, useRef } from "react";

// App title
const APP_TITLE = "Do Time Voice Note App";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true; // Set to true for continuous recording
recognition.interimResults = true; // Get results as you speak
recognition.lang = "en-US";

function App() {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");
  const [interimNote, setInterimNote] = useState("");
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem("voice-notes");
    return saved ? JSON.parse(saved) : [];
  });
  
  // Use ref to maintain reference to recognition instance
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("voice-notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    // Set up recognition event handlers
    recognition.onresult = handleSpeechResult;
    recognition.onerror = handleSpeechError;
    recognition.onend = handleSpeechEnd;
    
    // Store recognition in ref
    recognitionRef.current = recognition;
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore errors when stopping recognition that isn't active
        }
      }
    };
  }, []);

  const handleSpeechResult = (event) => {
    // Get the transcript
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Update the interim note for display
    setInterimNote(interimTranscript);
    
    // If we have a final transcript, update the note
    if (finalTranscript) {
      setNote(prevNote => prevNote + finalTranscript);
    }
  };

  const handleSpeechError = (event) => {
    console.error('Speech recognition error', event.error);
    setListening(false);
    alert(`Voice input error: ${event.error}`);
  };

  const handleSpeechEnd = () => {
    // Only reset listening if we're not manually stopping
    if (listening) {
      // Try to restart if it stopped on its own
      try {
        recognition.start();
      } catch (error) {
        console.error('Could not restart recognition', error);
        setListening(false);
      }
    }
  };

  const startListening = () => {
    setNote(""); // Clear previous note
    setInterimNote(""); // Clear interim note
    setListening(true);
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Could not start recognition', error);
      setListening(false);
    }
  };

  const stopListening = () => {
    setListening(false);
    
    try {
      recognition.stop();
      
      // Save the note if it's not empty
      if (note.trim()) {
        // Create a note object with timestamp and content
        const newNote = {
          text: note.trim(),
          timestamp: new Date().toISOString()
        };
        setNotes(prev => [...prev, newNote]);
        setNote(""); // Clear the note after saving
      }
    } catch (error) {
      console.error('Could not stop recognition', error);
    }
  };

  const deleteNote = (index) => {
    const updated = [...notes];
    updated.splice(index, 1);
    setNotes(updated);
  };

  return (
    <div className="min-h-screen app-container text-center flex flex-col">
      <div className="flex-grow">
        <div className="app-header fade-in">
          <div className="title-with-logo">
            <img 
              src={process.env.PUBLIC_URL + "/Do TIME.png"} 
              alt="Do Time Logo" 
              className="app-logo"
            />
            <h1 className="text-3xl font-bold">Do Time Voice Note App</h1>
          </div>
          <p className="text-gray-600 mb-6">Record your thoughts with timestamps</p>
        </div>
        
        <div className="flex justify-center gap-4 mb-6">
          {!listening ? (
            <button
              onClick={startListening}
              className="btn-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="btn-primary bg-red-600 hover:bg-red-700 listening-animation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Recording
            </button>
          )}
        </div>
        
        {listening && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md border-l-4 border-red-500 max-w-2xl mx-auto recording-card">
            <div className="flex items-center mb-3">
              <span className="recording-indicator"></span>
              <h3 className="text-lg font-medium">Currently Recording:</h3>
            </div>
            <p className="text-gray-700 text-left">{note}<span className="text-blue-500">{interimNote}</span></p>
          </div>
        )}

        <div className="mt-8">
          <div className="notes-header mb-6">
            <h2 className="text-2xl font-bold mb-2">Your Notes</h2>
            <div className="w-20 h-1 bg-blue-500 mx-auto rounded-full"></div>
          </div>
          {notes.length === 0 && (
            <div className="empty-state">
              <p>No notes yet. Press the Start Recording button above to begin!</p>
            </div>
          )}
          <div className="notes-grid">
            {notes.map((note, idx) => (
              <div
                key={idx}
                className="note-card fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 font-medium">
                    {note.timestamp 
                      ? new Date(note.timestamp).toLocaleString() 
                      : `Note ${idx + 1}`}
                  </span>
                  <button
                    onClick={() => deleteNote(idx)}
                    className="btn-delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                </div>
                <p className="text-left">{typeof note === 'object' ? note.text : note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="app-footer mt-12">
        <div className="footer-content">
          <div className="footer-logo">
            <img src={process.env.PUBLIC_URL + "/Do TIME.png"} alt="Do Time Logo" className="footer-logo-img" />
          </div>
          <div className="footer-info">
            <p className="developer">Developed by <span className="font-medium">Michael Jones Mccarthy</span></p>
            <div className="contact-info">
              <a href="mailto:jmikel1.mk@gmail.com" className="contact-link">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                jmikel1.mk@gmail.com
              </a>
              <span className="contact-link">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                0247847633
              </span>
            </div>
            <p className="copyright">© {new Date().getFullYear()} Do Time. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
