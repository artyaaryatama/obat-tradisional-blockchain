import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CpotbPage from './components/CpotbPage';
import ObatPage from './components/ObatPage';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* Route ke halaman utama */}
          {/* <Route path="/" element={<Home />} /> */}
          
          {/* Route ke halaman CPOTB */}
          <Route path="/cpotb" element={<CpotbPage />} />
          
          {/* Route ke halaman Obat */}
          <Route path="/obat" element={<ObatPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
