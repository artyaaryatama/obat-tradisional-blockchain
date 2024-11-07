import React, { createContext, useContext, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children = null }) => {
  const [userDetails, setUserDetails] = useState({});

  return (
    <UserContext.Provider value={{ userDetails, setUserDetails }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
