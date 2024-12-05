import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

import CpotbPage from './pages/pabrik/CpotbPage';
import CdobPage from './pages/pbf/CdobPage';
import CpotbReqPage from './pages/pabrik/CpotbRequestPage';
import CdobReqPage from './pages/pbf/CdobRequestPage';
import CpotbApprove from './pages/bpom/CpotbApprove';
import CdobApprove from './pages/bpom/CdobApprove';
import NieApprove from './pages/bpom/NieApprove';
import ObatNie from './pages/pabrik/NiePage';
import ObatProduce from './pages/pabrik/ObatProducePage';
import ObatCreate from './pages/pabrik/ObatCreatePage';
import ObatOrderPagePabrik from './pages/pabrik/ObatOrderPagePabrik';
import ObatOrderPbf from './pages/pbf/ObatOrderPagePbf';
import ObatCreateOrderPbf from './pages/pbf/ObatCreateOrderPagePbf';
import ObatReadyPbf from './pages/pbf/ObatReadyPbf';
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
            path="/obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ObatNie />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create-obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ObatCreate />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/obat-produce" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ObatProduce />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/order-obat-pabrik" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ObatOrderPagePabrik />
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
            path="/obat-order-pbf" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ObatOrderPbf />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/obat-order-create-pbf" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ObatCreateOrderPbf />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/obat-ready-pbf" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ObatReadyPbf />
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
            path="/cdob-bpom" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CdobApprove />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/nie-bpom" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <NieApprove />
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
