import logo from './logo.svg';
// src/App.js
import React, { useState, useEffect } from "react";
import './App.css';

const Chat = ({ userID, token, roomID }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null); // Timeout for typing notification
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (token) {
      // Connect to WebSocket server
      const newSocket = new WebSocket(`wss://g20-8uwy.onrender.com/ws/chat/?token=${token}`);
      
      newSocket.onopen = function () {
        console.log('Websocket Opened')
      };

      newSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        setMessages((prevMessages) => {
          // Check for typing notification
          if (data.type == 'typing') {
            if (!isTyping) { // Avoid duplication of typing indicator
              setIsTyping(true); // Set typing status
            }
            return prevMessages; // Don't add typing message to the chat
          } else if (data.message) {
            // Reset typing status after a message is received
            setIsTyping(false);
            return [...prevMessages, `User_${userID}: ${data.message}`];
          }
          return prevMessages; // Return previous messages if no relevant data
        });
      };

      newSocket.onclose = function () {
        console.log('WebSocket closed');
      };

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [userID, token, roomID]);

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) { 
      if (inputMessage.trim() !== "") {
        socket.send(JSON.stringify({ message: inputMessage, recipient_id: userID, room_id: roomID }));
        setInputMessage("");
      }
    } else {
      console.error("Socket is not open");
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // Send typing notification
    if (socket && socket.readyState === WebSocket.OPEN) {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      socket.send(JSON.stringify({ typing: true, userID, recipient_id: userID })); // Send typing notification
      setTypingTimeout(setTimeout(() => {
        socket.send(JSON.stringify({ typing: false, userID,  recipient_id: userID })); // Optionally send typing: false
      }, 1000)); // Send typing: false after 1 second of inactivity
    }
  };

  return (
    <div className="chat-container">
      <h1>Chat Room: {roomID}</h1>
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
      {isTyping && <div>User is typing...</div>} {/* Display typing indicator above input */}
      <input
        type="text"
        value={inputMessage}
        onChange={handleInputChange} // Use the new handler
        placeholder="Type your message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

const App = () => {
  const [userID, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [roomID, setRoomId] = useState("");

  return (
    <div className="App">
      <h1>React WebSocket Chat</h1>
      <div>
        <label>
          User Recipient ID: 
          <input 
            type="number" 
            value={userID} 
            onChange={(e) => setUserId(e.target.value)} 
            placeholder="Enter User Id" 
          />
        </label>
      </div>
      <div>
        <label>
          Token: 
          <input 
            type="text" 
            value={token} 
            onChange={(e) => setToken(e.target.value)} 
            placeholder="Enter your token" 
          />
        </label>
      </div>
      <div>
        <label>
          Room ID: 
          <input 
            type="number" 
            value={roomID} 
            onChange={(e) => setRoomId(e.target.value)} 
            placeholder="Enter your room id" 
          />
        </label>
      </div>
      <Chat userID={Number(userID)} token={token} roomID={Number(roomID)} />
    </div>
  );
};

export default App;
