import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import QRCheckInPage from './components/QRCheckInPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/check-in" element={<QRCheckInPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;