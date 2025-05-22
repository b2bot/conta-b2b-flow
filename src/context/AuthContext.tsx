
import * as React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface User {
  id?: string;
  email: string;
  nome_completo: string;
  empresa: string;
  telefone: string;
  token?: string;
  avatar_url?: string; // Add avatar_url property
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create the auth context
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Add this function to update user details
  const updateUser = (updatedUser: User) => {
    // Make sure to maintain avatar_url if present in the current user
    const mergedUser = {
      ...updatedUser,
      avatar_url: updatedUser.avatar_url || (user?.avatar_url || undefined)
    };
    setUser(mergedUser);
    localStorage.setItem('user', JSON.stringify(mergedUser));
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      if (response.status === 'success') {
        const userData: User = {
          id: response.id,
          email: response.email,
          nome_completo: response.nome_completo,
          empresa: response.empresa,
          telefone: response.telefone,
          token: response.token,
          avatar_url: response.avatar_url
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect to the previous page or to the dashboard
        const origin = location.state?.from?.pathname || '/';
        navigate(origin, { replace: true });
      } else {
        // Handle login error (show message)
        console.error('Login failed:', response.message);
        // You can show an error message using a toast or other UI element
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle unexpected errors
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const contextValue: AuthContextType = {
    user,
    signIn,
    signOut,
    loading,
    updateUser,
    isAuthenticated: !!user,
    isLoading: loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// A wrapper for components that require authentication.
interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return <div>Loading...</div>;
  }

  if (!auth.user) {
    // Redirect to the login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthContext;
