import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatroomService } from '../services/chatroom';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../hooks/useToast';
import './ChatroomList.css';

const ChatroomList = () => {
  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadChatrooms();
  }, []);

  const loadChatrooms = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await chatroomService.listChatrooms();

      // If backend doesn't provide is_member field, check localStorage
      const joinedChatrooms = JSON.parse(localStorage.getItem('joinedChatrooms') || '[]');
      const enrichedData = data.map(chatroom => ({
        ...chatroom,
        is_member: chatroom.is_member !== undefined ? chatroom.is_member : joinedChatrooms.includes(chatroom.id)
      }));

      setChatrooms(enrichedData);
    } catch (err) {
      const errorMsg = 'Failed to load chatrooms';
      setError(errorMsg);
      toast.showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChatroom = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.showWarning('Please enter a chatroom name');
      return;
    }

    if (!formData.description.trim()) {
      toast.showWarning('Please enter a description');
      return;
    }

    setCreateLoading(true);
    setError('');

    try {
      const newChatroom = await chatroomService.createChatroom(formData);

      // Mark as member in localStorage (creator is automatically a member)
      const joinedChatrooms = JSON.parse(localStorage.getItem('joinedChatrooms') || '[]');
      if (!joinedChatrooms.includes(newChatroom.id)) {
        joinedChatrooms.push(newChatroom.id);
        localStorage.setItem('joinedChatrooms', JSON.stringify(joinedChatrooms));
      }

      setChatrooms([...chatrooms, { ...newChatroom, is_member: true }]);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', is_private: false });
      toast.showSuccess('Chatroom created successfully!');
      navigate(`/chatrooms/${newChatroom.id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create chatroom';
      setError(errorMsg);
      toast.showError(errorMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinChatroom = async (chatroomId, isMember) => {
    // If already a member, just navigate to the chatroom
    if (isMember) {
      navigate(`/chatrooms/${chatroomId}`);
      return;
    }

    // Otherwise, try to join the chatroom first
    try {
      await chatroomService.joinChatroom(chatroomId);

      // Save to localStorage to remember user is a member
      const joinedChatrooms = JSON.parse(localStorage.getItem('joinedChatrooms') || '[]');
      if (!joinedChatrooms.includes(chatroomId)) {
        joinedChatrooms.push(chatroomId);
        localStorage.setItem('joinedChatrooms', JSON.stringify(joinedChatrooms));
      }

      toast.showSuccess('Joined chatroom successfully!');
      navigate(`/chatrooms/${chatroomId}`);
    } catch (err) {
      // Check if the error is because user is already a member
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || '';
      const isAlreadyMember = errorMessage.toLowerCase().includes('already') ||
                              errorMessage.toLowerCase().includes('member');

      if (isAlreadyMember) {
        // If already a member, save to localStorage and navigate
        const joinedChatrooms = JSON.parse(localStorage.getItem('joinedChatrooms') || '[]');
        if (!joinedChatrooms.includes(chatroomId)) {
          joinedChatrooms.push(chatroomId);
          localStorage.setItem('joinedChatrooms', JSON.stringify(joinedChatrooms));
        }
        navigate(`/chatrooms/${chatroomId}`);
      } else {
        // Show error for other types of failures
        toast.showError(errorMessage || 'Failed to join chatroom');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  if (loading) {
    return <div className="loading">Loading chatrooms...</div>;
  }

  return (
    <div className="chatroom-list-container">
      <div className="chatroom-list-header">
        <h2>Available Chatrooms</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Create Chatroom
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {chatrooms.length === 0 ? (
        <div className="empty-state">
          <p>No chatrooms available. Create one to get started!</p>
        </div>
      ) : (
        <div className="chatroom-grid">
          {chatrooms.map((chatroom) => (
            <div key={chatroom.id} className="chatroom-card">
              <h3>{chatroom.name}</h3>
              <p className="chatroom-description">{chatroom.description}</p>
              <div className="chatroom-meta">
                <span className="chatroom-type">
                  {chatroom.is_private ? '🔒 Private' : '🌐 Public'}
                </span>
                <span className="chatroom-members">
                  👥 {chatroom.member_count || 0} members
                </span>
              </div>
              <button
                onClick={() => handleJoinChatroom(chatroom.id, chatroom.is_member)}
                className="btn btn-secondary"
              >
                {chatroom.is_member ? 'Open' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Chatroom</h3>
            <form onSubmit={handleCreateChatroom}>
              <div className="form-group">
                <label htmlFor="name">Chatroom Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_private"
                    checked={formData.is_private}
                    onChange={handleChange}
                  />
                  Private Chatroom
                </label>
              </div>
              <div className="button-group">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={createLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatroomList;

