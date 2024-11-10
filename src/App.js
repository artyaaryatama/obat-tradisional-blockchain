import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';
import ProtectedRoute from './routes/ProtectedRoute';
import CpotbPage from './pages/pabrik/CpotbPage';
import CdobPage from './pages/pbf/CdobPage';
// import ObatPage from './components/ObatPage';\
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/auth/LoginUser';
import RegisterPage from './pages/auth/RegisterUser';
import UnauthorizedPage from './pages/error/Unauthorized';

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
                <Navbar />
                <CpotbPage />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
        </Routes>
    </Router>
  );
}

export default App;
