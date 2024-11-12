import React from 'react';
import { Link, useNavigate, useLocation  } from 'react-router-dom';

// import imgLodgout from '../../assets/images/loader.svg';
import "../styles/Navbar.scss"

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  // Fetch user data from session storage
  const currentPath = location.pathname;  
  const userdata = JSON.parse(sessionStorage.getItem('userdata')) || {};
  const userRole = userdata.role;
  console.log(userdata);

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
              <ul className="">
                {userRole === '0' && (
                  <>
                    <li className={currentPath === '/cpotb' ? 'active' : ''}>
                      <a to="/cpotb">CPOTB</a>
                    </li>
                    <li className={currentPath === '/another-link' ? 'active' : ''}>
                      <a to="/another-link">OBAT TRADISIONAL</a>
                    </li>
                  </>
                )}
                {userRole === '1' && (
                  <>
                    <li className={currentPath === '/cdob' ? 'active' : ''}>
                      <a to="/cdob">CDOB</a>
                    </li>
                    <li className={currentPath === '/another-link' ? 'active' : ''}>
                      <a to="/another-link">OBAT TRADISIONAL</a>
                    </li>
                  </>
                )}
                {userRole === '2' && (
                  <>
                    <li className={currentPath === '/cpotb-bpom' || '/cdob-bpom' ? 'active' : ''}>
                      <a to="/cpotb-bpom">SERTIFIKASI</a>
                    </li>
                    <li className={currentPath === '/another-link' ? 'active' : ''}>
                      <a to="/another-link">IZIN EDAR</a>
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
