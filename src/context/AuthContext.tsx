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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

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

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // AQUI: Corrigido o nome do campo!
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // MUDE ESTA LINHA:
      // await authAPI.login({ email, password });  // ERRADO
      const response = await authAPI.login({ email, senha: password }); // CERTO

      if (response.status === 'success') {
        const userData: User = {
          id: response.id,
          email: response.email,
          nome_completo: response.nome_completo,
          empresa: response.empresa,
          telefone: response.telefone,
          token: response.token
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        const origin = location.state?.from?.pathname || '/dashboard';
        navigate(origin, { replace: true });
      } else {
        console.error('Login failed:', response.message);
      }
    } catch (error) {
      console.error('Login error:', error);
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
    login,
    signOut,
    loading,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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
    return (
      <React.Fragment>
        <Navigate to="/login" state={{ from: location }} replace />
      </React.Fragment>
    );
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default AuthContext;
