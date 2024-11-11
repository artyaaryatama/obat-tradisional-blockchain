import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';
import ProtectedRoute from './routes/ProtectedRoute';

import CpotbPage from './pages/pabrik/CpotbPage';
import CdobPage from './pages/pbf/CdobPage';
import CpotbReqPage from './pages/pabrik/CpotbRequestPage';
// import ObatPage from './components/ObatPage';\
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/auth/LoginUser';
import RegisterPage from './pages/auth/RegisterUser';
import UnauthorizedPage from './pages/error/Unauthorized';
import ErrorPage from './pages/error/Error';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />
          
          <Route 
            path="/error" 
            element={
              <>
                <Navbar />
                <ErrorPage />
                <Footer />
              </>
            } 
          />

          <Route 
            path="/unauthorized" 
            element={
              <>
                <Navbar />
                <UnauthorizedPage />
                <Footer />
              </>
            } 
          />

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

          <Route 
            path="/request-cpotb" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <CpotbReqPage />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
        </Routes>
    </Router>
  );
}

export default App;
