import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CdobPage from './components/CdobPage';
import CpotbPage from './components/CpotbPage';
// import ObatPage from './components/ObatPage';
import RegisterPage from './components/RegisterUser';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* Route ke halaman utama */}
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/cpotb" element={<CpotbPage />} />
          <Route path="/cdob" element={<CdobPage />} />
          {/* <Route path="/obat" element={<ObatPage />} /> */}
          <Route path="/register-user" element={<RegisterPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
