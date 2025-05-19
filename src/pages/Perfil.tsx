
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Perfil = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Fetch user profile data
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await authAPI.getUserProfile();
        if (response.success) {
          // Update form with fetched data
          setFormData(prev => ({
            ...prev,
            name: response.user.name || prev.name,
            email: response.user.email || prev.email,
          }));
          return response.user;
        }
        return null;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar os dados do usuário",
          variant: "destructive",
        });
        return null;
      }
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await authAPI.updateUserProfile(data);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram atualizadas com sucesso",
        });
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      } else {
        toast({
          title: "Erro ao atualizar perfil",
          description: data.message || "Não foi possível atualizar suas informações",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password fields if attempting to change password
    if (formData.newPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        toast({
          title: "Senha atual obrigatória",
          description: "Para alterar a senha, informe a senha atual",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Senhas não conferem",
          description: "A nova senha e a confirmação devem ser iguais",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.newPassword.length < 6) {
        toast({
          title: "Senha muito curta",
          description: "A nova senha deve ter pelo menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Only send what's needed
    const dataToUpdate = {
      name: formData.name,
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    };
    
    updateProfileMutation.mutate(dataToUpdate);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Meu Perfil</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-dark">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-purple" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Nome</span>
                  <p className="font-medium">{userProfile?.name || user?.name || 'Não definido'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">E-mail</span>
                  <p className="font-medium">{userProfile?.email || user?.email}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Função</span>
                  <p className="font-medium">{userProfile?.role || 'Administrador'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-purple-dark">Alterar Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Nome</label>
                <Input 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">Senha Atual</label>
                <Input 
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Necessária para alterar a senha"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">Nova Senha</label>
                <Input 
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Nova senha"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</label>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirme a nova senha"
                />
              </div>
              
              <Button 
                type="submit" 
                className="bg-purple hover:bg-purple/90 w-full mt-4"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;
