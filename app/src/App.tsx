// App.tsx
import { useEffect, useState, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

function App() {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<string[]>([]);
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

    // socketRef.current = io(apiBaseUrl, {
    //   path: '/socket.io', // Ensure this matches your server configuration
    //   transports: ['websocket'], // Enforce WebSocket transport only
    //   withCredentials: true,
    // });

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
    socketRef.current.on('receiveMessage', (msg: string) => {
      setChatMessages((prevMessages) => [...prevMessages, msg]);
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

  const sendMessage = () => {
    if (inputMessage.trim() === '') return;
    if (socketRef.current && isConnected) {
      socketRef.current.emit('sendMessage', inputMessage);
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
      <div>
        <h2>Chat Messages:</h2>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          {chatMessages.length > 0 ? (
            chatMessages.map((msg, index) => (
              <p key={index}>{msg}</p>
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
    </div>
  );
}

export default App;
