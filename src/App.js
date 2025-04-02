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
import LoginPage from './pages/auth/LoginUser';
import RegisterPage from './pages/auth/RegisterUser';
import CheckObatIpfs from './pages/public/CheckObat';
import ChechCerticateIpfs from './pages/public/CheckCertificate';
import CheckTransaction from './pages/public/CheckTransaction';
import UnauthorizedPage from './pages/Error/Unauthorized'; 
import FetchBlockchainData from './pages/public/FetchBlockchainData';
import CheckObatPieces from './pages/public/CheckObatPieces';
import CheckCertificatePieces from './pages/public/CheckCertificatePieces';

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
          <Route path="/riwayat-Transaksi" element={<CheckTransaction />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/fetchBlockchain" element={<FetchBlockchainData />} />
          <Route path="/cek-obat" element={<CheckObatPieces />} />
          <Route path="/cek-sertifikat" element={<CheckCertificatePieces />} />

          <Route 
            path="/cpotb" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ManageCpotb />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/request-cpotb" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <CpotbRequest />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/renew-request-cpotb" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <CpotbRenewRequest />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ManageNieFactory />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/request-nie" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <NieRequest />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/renew-request-nie" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <NieRenewRequest />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/create-obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <CreateObat />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/add-quantity-obat" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <AddQuantityObat />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/obat-available-factory" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <StockObatFactory />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/manage-orders-factory" 
            element={
              <ProtectedRoute allowedRoles={['0']}>
                <Navbar />
                <ManageOrderFactoryPbf />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ManageCdob />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/request-cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <CdobRequest />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/renew-request-cdob" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <CdobRenewRequest />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/pbf-orders" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ManageOrderPbf />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/create-pbf-order" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <CreateOrderPbf />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/obat-available-pbf" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <StockObatPbf />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/manage-orders-pbf" 
            element={
              <ProtectedRoute allowedRoles={['1']}>
                <Navbar />
                <ManageOrderPbfRetailer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/cpotb-approval" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CpotbApprove />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/cdob-approval" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CdobApprove />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/nie-approval" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <NieApprove />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/create-retailer-order" 
            element={
              <ProtectedRoute allowedRoles={['3']}>
                <Navbar />
                <CreateOrderRetailer />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/retailer-orders" 
            element={
              <ProtectedRoute allowedRoles={['3']}>
                <Navbar />
                <ManageOrderRetailer />
              </ProtectedRoute>
            } 
          />
          

          <Route 
            path="/obat-available-retailer" 
            element={
              <ProtectedRoute allowedRoles={['3']}>
                <Navbar />
                <StockObatRetailer />
              </ProtectedRoute>
            } 
          />
          

          {/* <Route 
            path="/cdob-approval" 
            element={
              <ProtectedRoute allowedRoles={['2']}>
                <Navbar />
                <CpotbApprove />
              </ProtectedRoute>
            } 
          /> */}
          
        </Routes>
      </Router>
    </React.StrictMode>
  );
}

export default App;
