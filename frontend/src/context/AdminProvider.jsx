import { createContext, useContext, useLayoutEffect, useState } from 'react';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [context, setContext] = useState({
    isSidebarCollapsed: false,
  });
  const updateContext = (newContext) => {
    setContext((prev) => ({ ...prev, ...newContext }));
  };

  useLayoutEffect(() => {
    const cookieValue = getCookie('react-resizable-panels:collapsed');
    updateContext({
      isSidebarCollapsed: cookieValue === 'true',
    });
  }, []);

  return (
    <AdminContext.Provider
      value={{
        ...context,
        updateContext,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  return useContext(AdminContext);
};

export const getCookie = (cookieName) => {
  const name = cookieName + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return '';
};
