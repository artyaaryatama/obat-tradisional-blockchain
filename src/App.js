import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

import ManageCpotb from './pages/factory/ManageCpotb';
import ManageCdob from './pages/pbf/ManageCdob';
import CpotbRequest from './pages/factory/CpotbRequest';
import CdobRequest from './pages/pbf/CdobRequest';
import CpotbApprove from './pages/bpom/CpotbApprove';
import CdobApprove from './pages/bpom/CdobApprove';
import NieApprove from './pages/bpom/NieApprove';
import ManageNieFactory from './pages/factory/ManageNieFactory';
import StockObatFactory from './pages/factory/StockObatFactory';
import CreateObat from './pages/factory/CreateObat';
import ManageOrderFactoryPbf from './pages/factory/ManageOrderFactoryPbf';
import ManageOrderPbf from './pages/pbf/ManageOrderPbf';
import CreateOrderPbf from './pages/pbf/CreateOrderPbf';
import StockObatPbf from './pages/pbf/StockObatPbf';
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
                <ManageCpotb />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/request-cpotb" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <CpotbRequest />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ManageNieFactory />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create-obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <CreateObat />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/obat-available-factory" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <StockObatFactory />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/manage-orders-factory" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ManageOrderFactoryPbf />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ManageCdob />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/request-cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <CdobRequest />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/pbf-orders" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ManageOrderPbf />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/create-pbf-order" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <CreateOrderPbf />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/obat-available-pbf" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <StockObatPbf />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cpotb-approval" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CpotbApprove />
                <Footer />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/cdob-approval" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CdobApprove />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/nie-approval" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <NieApprove />
                <Footer />
              </ProtectedRoute>
            } 
          />
          

          {/* <Route 
            path="/cdob-approval" 
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
