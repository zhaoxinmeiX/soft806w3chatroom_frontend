import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatroomService } from '../services/chatroom';
import { messageService } from '../services/message';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatRelativeTime } from '../utils/dateFormatter';
import './ChatroomDetail.css';

const ChatroomDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatroom, setChatroom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    const initChatroom = async () => {
      try {
        setLoading(true);
        const [chatroomData, messagesData] = await Promise.all([
          chatroomService.getChatroomDetails(id),
          messageService.getMessages(id),
        ]);
        setChatroom(chatroomData);
        setMessages(messagesData.results || messagesData);
        setError('');

        // If we can successfully load the chatroom, user must be a member
        // Save to localStorage
        const joinedChatrooms = JSON.parse(localStorage.getItem('joinedChatrooms') || '[]');
        const chatroomIdNum = parseInt(id);
        if (!joinedChatrooms.includes(chatroomIdNum)) {
          joinedChatrooms.push(chatroomIdNum);
          localStorage.setItem('joinedChatrooms', JSON.stringify(joinedChatrooms));
        }
      } catch (err) {
        setError('Failed to load chatroom');
      } finally {
        setLoading(false);
      }
    };

    initChatroom();

    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await messageService.getMessages(id);
        setMessages(data.results || data);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await messageService.sendMessage(id, newMessage);
      setNewMessage('');
      const data = await messageService.getMessages(id);
      setMessages(data.results || data);
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await messageService.searchMessages(id, searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search messages');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleLeaveChatroom = async () => {
    if (window.confirm('Are you sure you want to leave this chatroom?')) {
      try {
        await chatroomService.leaveChatroom(id);

        // Remove from localStorage
        const joinedChatrooms = JSON.parse(localStorage.getItem('joinedChatrooms') || '[]');
        const updatedChatrooms = joinedChatrooms.filter(chatroomId => chatroomId !== parseInt(id));
        localStorage.setItem('joinedChatrooms', JSON.stringify(updatedChatrooms));

        navigate('/chatrooms');
      } catch (err) {
        setError('Failed to leave chatroom');
      }
    }
  };

  const handleDeleteChatroom = async () => {
    if (window.confirm('Are you sure you want to delete this chatroom? This action cannot be undone.')) {
      try {
        await chatroomService.deleteChatroom(id);

        // Remove from localStorage
        const joinedChatrooms = JSON.parse(localStorage.getItem('joinedChatrooms') || '[]');
        const updatedChatrooms = joinedChatrooms.filter(chatroomId => chatroomId !== parseInt(id));
        localStorage.setItem('joinedChatrooms', JSON.stringify(updatedChatrooms));

        navigate('/chatrooms');
      } catch (err) {
        setError('Failed to delete chatroom');
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await chatroomService.removeMember(id, memberId);
        const chatroomData = await chatroomService.getChatroomDetails(id);
        setChatroom(chatroomData);
      } catch (err) {
        setError('Failed to remove member');
      }
    }
  };

  if (loading && !chatroom) {
    return <div className="loading">Loading chatroom...</div>;
  }

  const isOwner = chatroom?.owner_id === user?.id || chatroom?.owner === user?.id;
  const displayMessages = searchResults || messages;

  return (
    <div className="chatroom-detail-container">
      <div className="chatroom-header">
        <div className="chatroom-info">
          <h2>{chatroom?.name}</h2>
          <p>{chatroom?.description}</p>
        </div>
        <div className="chatroom-actions">
          <button onClick={handleLeaveChatroom} className="btn btn-secondary">
            Leave
          </button>
          {isOwner && (
            <button onClick={handleDeleteChatroom} className="btn btn-danger">
              Delete
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="chatroom-content">
        <div className="chat-section">
          <div className="search-bar">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-small">
                Search
              </button>
              {searchResults && (
                <button type="button" onClick={clearSearch} className="btn btn-small">
                  Clear
                </button>
              )}
            </form>
          </div>

          <div className="messages-container">
            {displayMessages.length === 0 ? (
              <div className="empty-messages">
                {searchResults ? 'No messages found' : 'No messages yet. Start the conversation!'}
              </div>
            ) : (
              displayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender_username === user?.username || message.sender === user?.username ? 'message-own' : ''}`}
                >
                  <div className="message-header">
                    <span className="message-sender">
                      {message.sender_display_name || message.sender_username || message.sender_name || message.sender || 'Unknown'}
                    </span>
                    <span className="message-timestamp">
                      {new Date(message.timestamp || message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="message-input-form">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sendingMessage}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sendingMessage || !newMessage.trim()}
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        <div className="members-section">
          <h3>Members</h3>
          <div className="members-list">
            {chatroom?.members?.map((member) => (
              <div key={member.id} className="member-item">
                <span className="member-name">
                  {member.display_name || member.username}
                  {member.id === chatroom.owner_id && ' 👑'}
                </span>
                {isOwner && member.id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="btn btn-danger btn-small"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatroomDetail;

