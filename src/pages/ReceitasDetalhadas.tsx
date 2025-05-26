
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { useReceitas, ReceitaForm as ReceitaFormType } from '@/hooks/useReceitas';
import ReceitaForm from '@/components/receitas/ReceitaForm';
import { formatCurrency } from '@/utils/fileUtils';

const ReceitasDetalhadas: React.FC = () => {
  const {
    receitas,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterTipo,
    setFilterTipo,
    categories,
    contacts,
    financialSummary,
    saveReceitaMutation
  } = useReceitas();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newReceita, setNewReceita] = useState<ReceitaFormType>({
    data: new Date(),
    codigo: '',
    contato_id: '',
    servico: '',
    plano: '',
    categoria_id: '',
    valor: '',
    tipo: 'Receita',
    modeloCobranca: 'Assinatura',
    status: 'A receber',
    entregasPrincipais: ''
  });

  const resetForm = () => {
    setNewReceita({
      data: new Date(),
      codigo: '',
      contato_id: '',
      servico: '',
      plano: '',
      categoria_id: '',
      valor: '',
      tipo: 'Receita',
      modeloCobranca: 'Assinatura',
      status: 'A receber',
      entregasPrincipais: ''
    });
    setIsEditing(false);
  };

  const handleSaveReceita = () => {
    if (!newReceita.codigo || !newReceita.servico || !newReceita.valor) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    saveReceitaMutation.mutate(newReceita, {
      onSuccess: () => {
        setDialogOpen(false);
        resetForm();
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Recebido':
        return 'text-green-600 bg-green-50';
      case 'A receber':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receitas Detalhadas</h1>
          <p className="text-gray-600 mt-1">Gestão detalhada de receitas e serviços</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button 
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-purple hover:bg-purple/90 shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Receita
          </Button>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Edite os detalhes da receita abaixo.' : 'Preencha os detalhes da nova receita abaixo.'}
              </DialogDescription>
            </DialogHeader>
            <ReceitaForm
              isEditing={isEditing}
              newReceita={newReceita}
              setNewReceita={setNewReceita}
              handleSaveReceita={handleSaveReceita}
              onCancel={() => setDialogOpen(false)}
              categories={categories}
              contacts={contacts}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Recebido</div>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(financialSummary.recebido)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">A Receber</div>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(financialSummary.aReceber)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold text-purple">
              {formatCurrency(financialSummary.total)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Lucro</div>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(financialSummary.lucro)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e Pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por cliente, código ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Recebido">Recebido</SelectItem>
                <SelectItem value="A receber">A receber</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Serviço">Serviço</SelectItem>
                <SelectItem value="Produto">Produto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Receitas ({receitas.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple text-white hover:bg-purple">
                  <TableHead className="text-white font-medium min-w-[100px]">Data</TableHead>
                  <TableHead className="text-white font-medium min-w-[120px]">Cód. Cliente</TableHead>
                  <TableHead className="text-white font-medium min-w-[150px]">Contato</TableHead>
                  <TableHead className="text-white font-medium min-w-[150px]">Serviço</TableHead>
                  <TableHead className="text-white font-medium min-w-[120px]">Plano</TableHead>
                  <TableHead className="text-white font-medium min-w-[180px]">Categoria de Serviço</TableHead>
                  <TableHead className="text-white font-medium min-w-[120px]">Valor (R$)</TableHead>
                  <TableHead className="text-white font-medium min-w-[100px]">Tipo</TableHead>
                  <TableHead className="text-white font-medium min-w-[150px]">Modelo de Cobrança</TableHead>
                  <TableHead className="text-white font-medium min-w-[100px]">Status</TableHead>
                  <TableHead className="text-white font-medium min-w-[200px]">Entregas Principais</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receitas.map((receita) => (
                  <TableRow key={receita.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(receita.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{receita.codigo}</TableCell>
                    <TableCell className="max-w-40 truncate" title={receita.cliente}>
                      {receita.cliente}
                    </TableCell>
                    <TableCell className="max-w-32 truncate" title={receita.servico}>
                      {receita.servico}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{receita.plano}</TableCell>
                    <TableCell className="whitespace-nowrap">{receita.categoriaServico || '-'}</TableCell>
                    <TableCell className="font-medium text-green-600 whitespace-nowrap">
                      {formatCurrency(receita.valor)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{receita.tipo}</TableCell>
                    <TableCell className="whitespace-nowrap">{receita.modeloCobranca}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(receita.status)}`}>
                        {receita.status}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-48 truncate" title={receita.entregasPrincipais}>
                      {receita.entregasPrincipais}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceitasDetalhadas;
