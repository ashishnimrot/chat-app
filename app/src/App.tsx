import { useEffect, useState, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

function App() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ username: string; message: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    if (!apiBaseUrl) {
      console.error('VITE_API_BASE_URL is not defined');
      return;
    }

    // Fetch initial message from API
    axios
      .get(`${apiBaseUrl}/api/v1/test`)
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error('Error fetching API:', error);
      });

    socketRef.current = io(`${apiBaseUrl}`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    // Connection status handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    // Listen for messages from the server
    socketRef.current.on('receiveMessage', ({ username, message }) => {
      setChatMessages((prevMessages) => [...prevMessages, { username, message }]);
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
    });

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleSetUsername = () => {
    if (firstName.trim() && lastName.trim()) {
      setUsername(`${firstName} ${lastName}`);
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim() === '' || !username) return;
    if (socketRef.current && isConnected) {
      socketRef.current.emit('sendMessage', { username, message: inputMessage });
    } else {
      console.error('Socket is not connected');
    }
    setInputMessage('');
  };

  return (
    <div>
      <h1>Environment: {import.meta.env.MODE}</h1>
      <p>Message from API: {message}</p>
      <p>Socket.IO Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {!username ? (
        <div>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
          />
          <button onClick={handleSetUsername}>Set Username</button>
        </div>
      ) : (
        <div>
          <h2>Chat Messages:</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {chatMessages.length > 0 ? (
              chatMessages.map((msg, index) => (
                <p key={index}><strong>{msg.username}:</strong> {msg.message}</p>
              ))
            ) : (
              <p>No messages yet.</p>
            )}
          </div>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => (e.key === 'Enter' ? sendMessage() : null)}
            placeholder="Type your message..."
          />
          <button onClick={sendMessage} disabled={!isConnected}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export default App;