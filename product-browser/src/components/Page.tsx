import type { ReactNode } from 'react';
import './Page.scss';

interface PageProps {
  className: string;
  header: string;
  content: ReactNode;
}

export const Page: React.FC<PageProps> = ({ className, header, content }) => {
  return (
    <div className={`page ${className}`}>
      <header className="page__header">
        <h1>{header}</h1>
      </header>
      
      <div className="page__container">
        {content}
      </div>
    </div>
  );
};