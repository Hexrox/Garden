import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Use StrictMode only in development to avoid double useEffect calls in production
// StrictMode intentionally double-invokes effects in dev to help find bugs,
// but this can cause race conditions with loading states
if (process.env.NODE_ENV === 'development') {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  root.render(<App />);
}
