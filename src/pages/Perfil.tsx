
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userAPI } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

interface User {
  email: string;
  nome_completo: string;
  empresa: string;
  telefone: string;
}

interface ProfileForm {
  email: string;
  nome_completo: string;
  empresa: string;
  telefone: string;
}

const Perfil = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      email: user?.email || '',
      nome_completo: user?.nome_completo || '',
      empresa: user?.empresa || '',
      telefone: user?.telefone || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      const response = await userAPI.updateProfile(data);
      
      if (response.status === 'success') {
        toast({
          title: 'Sucesso!',
          description: 'Perfil atualizado com sucesso.',
        });
        
        // Atualiza o contexto de autenticação com os novos dados
        if (user) {
          updateUser({
            ...user,
            ...data,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro!',
          description: response.message || 'Erro ao atualizar perfil.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Ocorreu um erro ao atualizar o perfil.',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Meu Perfil</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center">
              <Avatar className="h-32 w-32 mb-6">
                <AvatarImage src="" />
                <AvatarFallback className="bg-purple text-white text-3xl">
                  {user?.nome_completo ? getInitials(user.nome_completo) : <UserCircle />}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold mb-1">{user?.nome_completo}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">{user?.empresa}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome Completo</Label>
                    <Input
                      id="nome_completo"
                      {...register('nome_completo', { required: 'Nome é obrigatório' })}
                    />
                    {errors.nome_completo && (
                      <p className="text-sm text-red-500">{errors.nome_completo.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', { 
                        required: 'E-mail é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'E-mail inválido',
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      {...register('empresa')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      {...register('telefone')}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-purple hover:bg-purple/90" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
