import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ count = 1, type = 'card', height = '100px' }) => {
  const renderSkeletons = () => {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <div key={i} className={`skeleton skeleton-${type}`} style={{ height }}>
          <div className="skeleton-shimmer"></div>
        </div>
      );
    }
    return skeletons;
  };

  return <div className="skeleton-container">{renderSkeletons()}</div>;
};

export default SkeletonLoader;

