import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from './UserContext';

function ProtectedRoute({ allowedRoles, children }) {
  const { userDetails } = useUser();

  // Check if user's role is in the list of allowed roles
  const role = typeof userDetails.role === "bigint" ? userDetails.role.toString() : userDetails.role;
  if (!userDetails || !allowedRoles.includes(role)) {
    // Redirect to unauthorized page if role is not allowed
    return <Navigate to="/401-unauthorized" replace />;
  }

  // Render children if user has an allowed role
  return children;
}

export default ProtectedRoute;
