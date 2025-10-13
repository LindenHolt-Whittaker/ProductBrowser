import React from 'react';
import './ErrorMessage.scss';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="error-message" role="alert">
      <h3>Error loading products</h3>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="error-message__retry">
          Try Again
        </button>
      )}
    </div>
  );
};