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
import { UserCircle, Upload, Eye, EyeOff } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface User {
  id?: string;
  email: string;
  nome_completo: string;
  empresa: string;
  telefone: string;
  token?: string;
}

interface ProfileForm {
  email: string;
  nome_completo: string;
  empresa: string;
  telefone: string;
  senha?: string;
  confirmacao_senha?: string;
}

const Perfil = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      email: user?.email || '',
      nome_completo: user?.nome_completo || '',
      empresa: user?.empresa || '',
      telefone: user?.telefone || '',
      senha: '',
      confirmacao_senha: '',
    },
  });

  const senha = watch("senha");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      // Validate password confirmation if password is provided
      if (data.senha && data.senha !== data.confirmacao_senha) {
        toast({
          variant: 'destructive',
          title: 'Erro!',
          description: 'As senhas não coincidem.',
        });
        setLoading(false);
        return;
      }

      // Remove confirmacao_senha from data to be sent to API
      const { confirmacao_senha, ...submitData } = data;
      
      // Only include senha if it's not empty
      if (!submitData.senha) {
        delete submitData.senha;
      }

      const response = await userAPI.updateProfile(submitData);
      
      if (response.status === 'success') {
        toast({
          title: 'Sucesso!',
          description: 'Perfil atualizado com sucesso.',
        });
        
        // Atualiza o contexto de autenticação com os novos dados
        if (user) {
          setUser({
            ...user,
            ...submitData,
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
              <div className="relative">
                <Avatar className="h-32 w-32 mb-6 cursor-pointer hover:opacity-90 transition-opacity" onClick={triggerFileInput}>
                  <AvatarImage src={avatarPreview || ""} />
                  <AvatarFallback className="bg-purple text-white text-3xl">
                    {user?.nome_completo ? getInitials(user.nome_completo) : <UserCircle className="h-16 w-16" />}
                  </AvatarFallback>
                  <div className="absolute bottom-0 right-0 bg-purple rounded-full p-1 cursor-pointer">
                    <Upload size={16} className="text-white" />
                  </div>
                </Avatar>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        {...register('senha')}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmacao_senha">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmacao_senha"
                        type={showPassword ? "text" : "password"}
                        {...register('confirmacao_senha', {
                          validate: value => 
                            !senha || value === senha || "As senhas não coincidem"
                        })}
                        autoComplete="new-password"
                      />
                      {errors.confirmacao_senha && (
                        <p className="text-sm text-red-500">{errors.confirmacao_senha.message}</p>
                      )}
                    </div>
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
