import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';
import ProtectedRoute from './routes/ProtectedRoute';

import CpotbPage from './pages/pabrik/CpotbPage';
import CdobPage from './pages/pbf/CdobPage';
import CpotbReqPage from './pages/pabrik/CpotbRequestPage';
import CdobReqPage from './pages/pbf/CdobRequestPage';
import CpotbApprove from './pages/bpom/CpotbApprove';
import CdobApprove from './pages/bpom/CdobApprove';
import ObatPage from './pages/pabrik/ObatPage';
import ObatReqPage from './pages/pabrik/ObatRequestPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/auth/LoginUser';
import RegisterPage from './pages/auth/RegisterUser';
import UnauthorizedPage from './pages/error/Unauthorized';
import ErrorPage from './pages/error/Error';

function App() {
  return (
    
    <React.StrictMode>
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

          <Route 
            path="/cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <CdobPage />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/request-cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <CdobReqPage />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cpotb-bpom" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CpotbApprove />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/cdob-pbf" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CdobApprove />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ObatPage />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/create-obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ObatReqPage />
                <Footer />
              </ProtectedRoute>
            } 
          />

          {/* <Route 
            path="/cdob-bpom" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CpotbApprove />
                <Footer />
              </ProtectedRoute>
            } 
          /> */}
          
        </Routes>
      </Router>
    </React.StrictMode>
  );
}

export default App;
