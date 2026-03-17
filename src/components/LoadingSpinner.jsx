import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', fullScreen = false, message = 'Loading...' }) => {
  const spinnerContent = (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-ring"></div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="loading-fullscreen">{spinnerContent}</div>;
  }

  return spinnerContent;
};

export default LoadingSpinner;

