import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';
import ProtectedRoute from './ProtectedRoute';

import CdobPage from './components/CdobPage';
import CpotbPage from './components/CpotbPage';
// import ObatPage from './components/ObatPage';
import LoginPage from './components/LoginUser';
import RegisterPage from './components/RegisterUser';
import UnauthorizedPage from './components/Unauthorized';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route 
            path="/cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <CdobPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cpotb" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <CpotbPage />
              </ProtectedRoute>
            } 
          />
          
        </Routes>
    </Router>
  );
}

export default App;
