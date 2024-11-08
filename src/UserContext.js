import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

export const UserProvider = ({ children = null }) => {
  const [userDetails, setUserDetails] = useState("");
  const navigate = useNavigate();

  
  useEffect(() =>{
    const protectedRoutes = ["/cpotb", "/cdob"];
    const isProtectedRoute = protectedRoutes.includes(window.location.pathname);

    if(!userDetails && isProtectedRoute) {
      navigate("/unauthorized")
    }
  }, [userDetails, navigate])

  return (
    <UserContext.Provider value={{ userDetails, setUserDetails }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
