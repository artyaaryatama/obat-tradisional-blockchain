import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import "../styles/Navbar.scss";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;  
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const userRole = userdata.role;

  function handleLogout() {
    sessionStorage.removeItem('userdata'); 
    navigate('/login');
  };

  return (
    <>
      <div className="layout-page">
        <nav className="navbar">
          <div className="navbar-menu">
            <div className="navbar-logo">
              <h2>ot-blockchain.</h2>
            </div>

            <div className="navbar-links">
              <ul>
                {userRole === '0' && (
                  <>
                    <li className={currentPath === '/cpotb' || currentPath === '/request-cpotb' ? 'active' : ''}>
                      <Link to="/cpotb">CPOTB</Link>
                    </li>
                    <li className={currentPath === '/obat-available-factory' || currentPath === '/create-obat' || currentPath === '/obat' | currentPath === '/manage-orders-factory' ? 'active' : ''}>
                      <Link to="/obat">OBAT TRADISIONAL</Link>
                    </li>
                  </>
                )}
                {userRole === '1' && (
                  <>
                    <li className={currentPath === '/cdob' || currentPath === '/request-cdob' ? 'active' : ''}>
                      <Link to="/cdob">CDOB</Link>
                    </li>
                    <li className={currentPath === '/pbf-orders' || currentPath=== '/create-pbf-order'? 'active' : ''}>
                      <Link to="/create-pbf-order">ORDER OBAT</Link>
                    </li>
                    <li className={currentPath === '/obat-available-pbf' || currentPath === '/manage-orders-pbf' ? 'active' : ''}>
                      <Link to="/obat-available-pbf">SELL OBAT</Link>
                    </li>
                  </>
                )}
                {userRole === '2' && (
                  <>
                    <li className={currentPath === '/cpotb-approval' || currentPath === '/cdob-approval' ? 'active' : ''}>
                      <Link to="/cpotb-approval">SERTIFIKASI</Link>
                    </li>
                    <li className={currentPath === '/nie-approval' ? 'active' : ''}>
                      <Link to="/nie-approval">IZIN EDAR</Link>
                    </li>
                  </>
                )}
                {userRole === '3' && (
                  <>
                    <li className={currentPath === '/retailer-orders' || currentPath === '/create-retailer-order' ? 'active' : ''}>
                      <Link to="/retailer-orders">ORDER OBAT</Link>
                    </li>
                    <li className={currentPath === '/nie-approval' ? 'active' : ''}>
                      <Link to="/error">CEK OBAT</Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="navbar-actions">
            {userdata.name && (
              <>
                <span className='instanceName'>{userdata.instanceName}</span>
                <span className='name'>{userdata.name}</span>
                <button onClick={handleLogout} className="logout-btn">
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
              </>
            )}
          </div>  
        </nav>
      </div>
    </>
  );
}

export default Navbar;
