import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { db } from '@focuspoint/shared/study-data/mockDatabase';
import { ThemeProvider } from '../shared/context/ThemeContext.jsx';
import { AuthProvider } from '../shared/context/AuthContext.jsx';
import App from './App.jsx';
import '../styles/index.css';

// Initialize the mock database on first load
db.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
