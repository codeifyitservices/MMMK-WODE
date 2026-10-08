import React, { useState } from 'react';
import { createContext, useContext } from 'react';
import { getStoredUserAuth } from '../utils/authStorage';

const userAuthContext = createContext();

const UserAuthProvider = ({ children }) => {
  const [data, setData] = useState(() => getStoredUserAuth());
  return (
    <userAuthContext.Provider value={{ data, setData }}>
      {children}
    </userAuthContext.Provider>
  );
};

export const useUserAuthContext = () => {
  return useContext(userAuthContext);
};

export default UserAuthProvider;
