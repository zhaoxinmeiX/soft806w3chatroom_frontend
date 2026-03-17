import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Chatroom App</h1>
        <p className="home-subtitle">
          Connect, chat, and collaborate with others in real-time
        </p>

        <div className="home-features">
          <div className="feature">
            <h3>💬 Real-time Chat</h3>
            <p>Send and receive messages instantly</p>
          </div>
          <div className="feature">
            <h3>🏠 Multiple Chatrooms</h3>
            <p>Create or join various chatrooms</p>
          </div>
          <div className="feature">
            <h3>🔍 Search Messages</h3>
            <p>Find what you need quickly</p>
          </div>
        </div>

        <div className="home-actions">
          {isAuthenticated ? (
            <Link to="/chatrooms" className="btn btn-large btn-primary">
              Go to Chatrooms
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-large btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-large btn-secondary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

