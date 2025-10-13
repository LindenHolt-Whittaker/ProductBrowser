import React from 'react';
import './LoadingSpinner.scss';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner" role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <p>Loading products...</p>
    </div>
  );
};