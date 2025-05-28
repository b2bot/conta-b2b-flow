// src/components/PlanoForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePlanos } from '@/hooks/usePlanos';

interface PlanoFormProps {
  open: boolean;
  onClose: () => void;
  defaultValues?: {
    id?: string;
    nome: string;
    descricao: string;
  };
}

export const PlanoForm = ({ open, onClose, defaultValues }: PlanoFormProps) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      nome: '',
      descricao: ''
    }
  });

  const { savePlanoMutation } = usePlanos();

  useEffect(() => {
    if (defaultValues) {
      reset({
        nome: defaultValues.nome,
        descricao: defaultValues.descricao
      });
    } else {
      reset({ nome: '', descricao: '' });
    }
  }, [defaultValues, reset]);

  const onSubmit = async (data: { nome: string; descricao: string }) => {
    await savePlanoMutation.mutateAsync({
      id: defaultValues?.id,
      nome: data.nome,
      descricao: data.descricao
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{defaultValues?.id ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('nome', { required: true })}
            placeholder="Nome do plano"
            disabled={isSubmitting}
          />
          <Input
            {...register('descricao')}
            placeholder="Descrição"
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {defaultValues?.id ? 'Salvar alterações' : 'Criar plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
