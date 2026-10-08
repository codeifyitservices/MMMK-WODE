import React, { useState } from 'react';
import { createContext, useContext } from 'react';
import { getStoredAdminAuth } from '../utils/adminAuth';

const adminAuthContext = createContext();

const AdminAuthProvider = ({ children }) => {
  const [data, setData] = useState(() => getStoredAdminAuth() || {});
  return (
    <adminAuthContext.Provider value={{ data, setData }}>
      {children}
    </adminAuthContext.Provider>
  );
};

export const useAdminAuthContext = () => {
  return useContext(adminAuthContext);
};

export default AdminAuthProvider;
