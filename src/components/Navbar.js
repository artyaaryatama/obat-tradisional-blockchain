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
                    <li className={currentPath === '/obat-produce' || currentPath === '/create-obat' || currentPath === '/obat' ? 'active' : ''}>
                      <Link to="/obat-produce">OBAT TRADISIONAL</Link>
                    </li>
                  </>
                )}
                {userRole === '1' && (
                  <>
                    <li className={currentPath === '/cdob' || currentPath === '/request-cdob' ? 'active' : ''}>
                      <Link to="/cdob">CDOB</Link>
                    </li>
                    <li className={currentPath === '/another-Link' ? 'active' : ''}>
                      <Link to="/another-Link">OBAT TRADISIONAL</Link>
                    </li>
                  </>
                )}
                {userRole === '2' && (
                  <>
                    <li className={currentPath === '/cpotb-bpom' || currentPath === '/cdob-bpom' ? 'active' : ''}>
                      <Link to="/cpotb-bpom">SERTIFIKASI</Link>
                    </li>
                    <li className={currentPath === '/nie-bpom' ? 'active' : ''}>
                      <Link to="/nie-bpom">IZIN EDAR</Link>
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
