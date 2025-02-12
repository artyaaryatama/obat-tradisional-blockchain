import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

import ManageCpotb from './pages/factory/ManageCpotb';
import ManageCdob from './pages/pbf/ManageCdob';
import CpotbRequest from './pages/factory/CpotbRequest';
import CpotbRenewRequest from './pages/factory/CpotbRenewRequest';
import CdobRequest from './pages/pbf/CdobRequest';
import NieRequest from './pages/factory/NieRequest';
import NieRenewRequest from './pages/factory/NieRenewRequest';
import CdobRenewRequest from './pages/pbf/CdobRenewRequest';
import CpotbApprove from './pages/bpom/CpotbApprove';
import CdobApprove from './pages/bpom/CdobApprove';
import NieApprove from './pages/bpom/NieApprove';
import ManageNieFactory from './pages/factory/ManageNieFactory';
import StockObatFactory from './pages/factory/StockObatFactory';
import CreateObat from './pages/factory/CreateObat';
import AddQuantityObat from './pages/factory/AddQuantityObat';
import ManageOrderFactoryPbf from './pages/factory/ManageOrderFactoryPbf';
import ManageOrderPbf from './pages/pbf/ManageOrderPbf';
import CreateOrderPbf from './pages/pbf/CreateOrderPbf';
import StockObatPbf from './pages/pbf/StockObatPbf';
import ManageOrderPbfRetailer from './pages/pbf/ManageOrderPbfRetailer';
import CreateOrderRetailer from './pages/retailer/CreateOrderRetailer';
import ManageOrderRetailer from './pages/retailer/ManageOrderRetailer';
import StockObatRetailer from './pages/retailer/StokObatRetailer';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/auth/LoginUser';
import RegisterPage from './pages/auth/RegisterUser';
import CheckObatIpfs from './pages/public/CheckObat';
import ChechCerticateIpfs from './pages/public/CheckCertificate';
import CheckTransaction from './pages/public/CheckTransaction';
import UnauthorizedPage from './pages/Error/Unauthorized';

function App() {
  return (
    
    <React.StrictMode>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/public/obat/:hash" element={<CheckObatIpfs />} />
          <Route path="/public/certificate/:hash" element={<ChechCerticateIpfs />} />
          <Route path="/lacak" element={<CheckTransaction />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

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
            path="/renew-request-cpotb" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <CpotbRenewRequest />
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
            path="/request-nie" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <NieRequest />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/renew-request-nie" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <NieRenewRequest />
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
            path="/add-quantity-obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <AddQuantityObat />
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
            path="/renew-request-cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <CdobRenewRequest />
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
            path="/manage-orders-pbf" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ManageOrderPbfRetailer />
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

          <Route 
            path="/create-retailer-order" 
            element={
              <ProtectedRoute allowedRoles={['3']}>
                <Navbar />
                <CreateOrderRetailer />
                <Footer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/retailer-orders" 
            element={
              <ProtectedRoute allowedRoles={['3']}>
                <Navbar />
                <ManageOrderRetailer />
                <Footer />
              </ProtectedRoute>
            } 
          />
          

          <Route 
            path="/obat-available-retailer" 
            element={
              <ProtectedRoute allowedRoles={['3']}>
                <Navbar />
                <StockObatRetailer />
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
