import React from 'react';
import { Navigate , useLocation} from 'react-router-dom';
import { useUser } from '../UserContext';

function ProtectedRoute({ allowedRoles, children }) {
  // const { userDetails } = useUser();

  // // Check if user's role is in the list of allowed roles
  // const role = typeof userDetails.role === "bigint" ? userDetails.role.toString() : userDetails.role;
  // if (!userDetails || !allowedRoles.includes(role)) {
  //   // Redirect to unauthorized page if role is not allowed
  //   // return <Navigate to="/401-unauthorized" replace />;
  // }

  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  const location = useLocation();

  // console.log(userdata)

  // Redirect only once if conditions are not met
  if (!userdata || !allowedRoles.includes(userdata.role)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }
  // Render children if user has an allowed role
  return children;
}

export default ProtectedRoute;
