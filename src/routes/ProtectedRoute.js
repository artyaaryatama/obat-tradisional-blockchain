import React from 'react';
import { Navigate , useLocation} from 'react-router-dom';

function ProtectedRoute({ allowedRoles, children }) {

  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const location = useLocation();

  if (!userdata || !allowedRoles.includes(userdata.role)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }
  return children;
}

export default ProtectedRoute;
