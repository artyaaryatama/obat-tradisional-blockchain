import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';

import CdobPage from './components/CdobPage';
import CpotbPage from './components/CpotbPage';
// import ObatPage from './components/ObatPage';
import LoginPage from './components/LoginUser';
import RegisterPage from './components/RegisterUser';

function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-user" element={<RegisterPage />} />
          {/* <Route path="/cpotb" element={<CpotbPage />} /> */}
          <Route path="/cdob" element={<CdobPage />} />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
