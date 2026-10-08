// /* eslint-disable react-refresh/only-export-components */
// /* eslint-disable react/prop-types */
// import { createContext, useContext, useState } from "react";

// const AuthContext = createContext();

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [authToken, setAuthToken] = useState(null);

//   const login = (token) => setAuthToken(token);
//   const logout = () => setAuthToken(null);

//   return (
//     <AuthContext.Provider value={{ authToken, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
