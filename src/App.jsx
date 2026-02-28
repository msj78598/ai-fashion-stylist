import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import IntakeForm from './pages/IntakeForm';
import StylistChat from './pages/StylistChat';

function App() {
  return (
    <Router>
      <div className="min-h-screen text-gray-800">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/intake" element={<IntakeForm />} />
          <Route path="/chat" element={<StylistChat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
