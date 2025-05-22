import { createContext, useState } from "react";

const AuthContext = createContext({});

// Able to let all components to use the state [auth, setAuth] because it wraps children with the AuthContext.Provider
// 
export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({});

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;