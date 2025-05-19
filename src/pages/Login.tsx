
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      // Hard-coded credentials as specified in requirements
      if (email === 'cobranca@leadclinic.com.br' && password === 'Vk@280112') {
        // Set user in localStorage
        localStorage.setItem('user', JSON.stringify({ email, isAuthenticated: true }));
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao Conta Partner B2B',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Erro de autenticação',
          description: 'Email ou senha incorretos',
          variant: 'destructive',
        });
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-purple">Conta</h1>
            <div className="bg-purple text-white text-xs px-2 py-1 rounded-md inline-block">
              Partner B2B
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center text-purple-dark">Acesse sua conta</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-purple-dark">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-purple-dark">
                    Senha
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="border-gray-300"
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit"
                className="w-full bg-purple hover:bg-purple/90" 
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
