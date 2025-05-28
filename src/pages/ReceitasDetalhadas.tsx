<<<<<<< HEAD
import React, { useState } from 'react';
=======
import { useState, useEffect } from 'react';
>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
<<<<<<< HEAD
import { Plus, Search, Filter, MoreVertical, Edit, Trash } from 'lucide-react';
=======
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Filter, MoreVertical, Edit, Trash, Copy, FileDown, FileUp, Calendar as CalendarIcon, X } from 'lucide-react';
>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
import { useReceitas, ReceitaForm as ReceitaFormType, Receita } from '@/hooks/useReceitas';
import ReceitaForm from '@/components/receitas/ReceitaForm';
import { formatCurrency, exportToExcel, importFromFile } from '@/utils/fileUtils';
import { useToast } from '@/hooks/use-toast';
import FileImport from '@/components/FileImport';

const ReceitasDetalhadas: React.FC = () => {
  const {
    receitas,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterTipo,
    setFilterTipo,
    filterServico,
    setFilterServico,
    filterPlano,
    setFilterPlano,
    filterModeloCobranca,
    setFilterModeloCobranca,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    resetDateFilter,
    categories,
    contacts,
    planos,
    servicos,
    modelosCobranca,
    financialSummary,
    saveReceitaMutation,
<<<<<<< HEAD
    deleteReceitaMutation
=======
    deleteReceitaMutation,
    duplicateReceita,
    refetch
>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
  } = useReceitas();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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

  const { toast } = useToast();

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

  const handleEditReceita = (receita: Receita) => {
    setIsEditing(true);
    
    // Parse the receita date
    let receitaDate;
    try {
      receitaDate = new Date(receita.data);
    } catch (e) {
      receitaDate = new Date();
    }
    
    setNewReceita({
      id: receita.id,
      data: receitaDate,
      codigo: receita.codigo,
      contato_id: receita.contato_id || '',
      servico: receita.servico,
      plano: receita.plano,
<<<<<<< HEAD
=======
      plano_id: receita.plano_id,
>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
      categoria_id: receita.categoria_id || '',
      valor: receita.valor.toString(),
      tipo: receita.tipo,
      modeloCobranca: receita.modeloCobranca,
      status: receita.status,
      entregasPrincipais: receita.entregasPrincipais
    });
    
    setDialogOpen(true);
  };

<<<<<<< HEAD
=======
  const handleDuplicateReceita = (receita: Receita) => {
    const duplicatedData = duplicateReceita(receita);
    setNewReceita(duplicatedData);
    setIsEditing(false);
    setDialogOpen(true);
    
    toast({
      title: "Receita duplicada",
      description: "Edite os dados conforme necessário e salve para criar uma nova receita.",
    });
  };

>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
  const handleDeleteReceita = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      deleteReceitaMutation.mutate(id);
    }
  };

<<<<<<< HEAD
=======
  const handleExportReceitas = () => {
    const dataToExport = receitas.map(r => ({
      Data: new Date(r.data).toLocaleDateString('pt-BR'),
      'Código Cliente': r.codigo,
      Cliente: r.cliente || '',
      Serviço: r.servico,
      Plano: r.plano,
      'Categoria de Serviço': r.categoriaServico || '',
      'Valor (R$)': r.valor,
      Tipo: r.tipo,
      'Modelo de Cobrança': r.modeloCobranca,
      Status: r.status,
      'Entregas Principais': r.entregasPrincipais || ''
    }));
    
    exportToExcel(dataToExport, `Receitas_Detalhadas_${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Exportação concluída",
      description: `${dataToExport.length} receitas exportadas com sucesso.`,
    });
  };

  const handleImportSuccess = async (data: any[]) => {
    console.log('Dados importados:', data);
    setImportDialogOpen(false);

    try {
      const res = await fetch('/api/importar-receitas-detalhadas.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.status === 'success') {
        toast({
          title: 'Importação concluída',
          description: `${data.length} receitas importadas com sucesso.`,
        });
        refetch();
      } else {
        toast({
          title: 'Erro ao importar',
          description: result.message || 'Erro inesperado.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Erro ao importar',
        description: 'Erro ao se comunicar com o servidor.',
        variant: 'destructive',
      });
      console.error(err);
    }
    
    // Refresh receitas list
    refetch();
  };

>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
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
          {/* Título reduzido de text-3xl para text-xl */}
          <h1 className="text-xl font-bold text-gray-900">Receitas Detalhadas</h1>
          <p className="text-gray-600 mt-1">Gestão detalhada de receitas e serviços</p>
        </div>
        <div className="flex space-x-2">
          {/* Botões de Exportar e Importar */}
          <Button 
            variant="outline"
            className="bg-white"
            onClick={handleExportReceitas}
          >
            <FileDown size={18} className="mr-2" />
            Exportar
          </Button>
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <Button variant="outline" className="bg-white" onClick={() => setImportDialogOpen(true)}>
              <FileUp size={18} className="mr-2" />
              Importar
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Receitas</DialogTitle>
                <DialogDescription>
                  Importe receitas a partir de um arquivo Excel ou CSV.
                </DialogDescription>
              </DialogHeader>
              <FileImport onImportSuccess={handleImportSuccess} />
            </DialogContent>
          </Dialog>
          
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
                planos={planos}
              />
            </DialogContent>
          </Dialog>
        </div>
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
        <CardHeader className="py-4" />
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
            {/* Campo de pesquisa com largura reduzida */}
            <div className="lg:w-1/4">
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
            
            {/* Filtro de Serviço */}
            <Select value={filterServico} onValueChange={setFilterServico}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Todos os Serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Serviços</SelectItem>
                {servicos.map((servico) => (
                  <SelectItem key={servico} value={servico}>
                    {servico}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtro de Plano */}
            <Select value={filterPlano} onValueChange={setFilterPlano}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Todos os Planos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                {planos.map((plano) => (
                  <SelectItem key={plano.id} value={plano.nome}>
                    {plano.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtro de Modelo de Cobrança */}
            <Select value={filterModeloCobranca} onValueChange={setFilterModeloCobranca}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Todos os Modelos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Modelos</SelectItem>
                {modelosCobranca.map((modelo) => (
                  <SelectItem key={modelo} value={modelo}>
                    {modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtro de Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Recebido">Recebido</SelectItem>
                <SelectItem value="A receber">A receber</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Tipo */}
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Todos os Tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Serviço">Serviço</SelectItem>
                <SelectItem value="Produto">Produto</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Filtro de Data - Calendários lado a lado */}
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full lg:w-auto justify-start text-left font-normal ${
                      !startDate && !endDate ? "" : "text-purple"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate && endDate ? (
                      `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
                    ) : startDate ? (
                      `A partir de ${format(startDate, 'dd/MM/yyyy')}`
                    ) : endDate ? (
                      `Até ${format(endDate, 'dd/MM/yyyy')}`
                    ) : (
                      "Filtrar por Data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    {/* Calendários lado a lado em vez de empilhados */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Data Inicial</h4>
                        <Calendar
                          mode="single"
                          selected={startDate || undefined}
                          onSelect={(date) => setStartDate(date)}
                          locale={ptBR}
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Data Final</h4>
                        <Calendar
                          mode="single"
                          selected={endDate || undefined}
                          onSelect={(date) => setEndDate(date)}
                          locale={ptBR}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetDateFilter}
                        className="mr-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => document.body.click()} // Hack to close popover
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
<<<<<<< HEAD
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
                  <TableHead className="text-white font-medium min-w-[80px]">Ações</TableHead>
=======
                <TableRow className="border-b border-gray-200">
                  <TableHead>Data</TableHead>
                  <TableHead>Cod.</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cobrança</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entregas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
                </TableRow>
              </TableHeader>
              <TableBody>
                {receitas.map((receita) => (
                  <TableRow key={receita.id} className="hover:bg-gray-50 text-sm first:border-t-0">
                    <TableCell>
                      {new Date(receita.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="px-2 py-1">{receita.codigo || '—'}</TableCell>
                    <TableCell className="max-w-[160px] truncate px-2 py-1" title={receita.cliente}>{receita.cliente || '—'}</TableCell>
                    <TableCell className="max-w-[180px] truncate px-2 py-1" title={receita.servico}>{receita.servico || '—'}</TableCell>
                    <TableCell className="max-w-[160px] truncate px-2 py-1" title={receita.plano}>{receita.plano || '—'}</TableCell>
                    <TableCell className="max-w-[160px] truncate px-2 py-1" title={receita.categoriaServico}>{receita.categoriaServico || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-green-600 px-2 py-1">{formatCurrency(receita.valor)}</TableCell>
                    <TableCell className="px-2 py-1">{receita.tipo}</TableCell>
                    <TableCell className="px-2 py-1">{receita.modeloCobranca}</TableCell>
                    <TableCell className="px-2 py-1">
                      <span className={`ppx-1 py-0.5 rounded-full text-sm font-medium ${getStatusColor(receita.status)}`}>
                        {receita.status}
                      </span>
                    </TableCell>
<<<<<<< HEAD
                    <TableCell className="max-w-48 truncate" title={receita.entregasPrincipais}>
                      {receita.entregasPrincipais}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
=======
                    <TableCell className="max-w-[200px] truncate px-2 py-1" title={receita.entregasPrincipais}>{receita.entregasPrincipais || '—'}</TableCell>
                    <TableCell className="text-right px-2 py-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4" />
>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditReceita(receita)}>
<<<<<<< HEAD
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteReceita(receita.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
=======
                            <Edit className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateReceita(receita)}>
                            <Copy className="mr-2 h-4 w-4" />Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteReceita(receita.id)} className="text-red-600">
                          <Trash className="mr-2 h-4 w-4" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
>>>>>>> f0648d5 (Atualizações locais de 28/05 às 11:25)
};

export default ReceitasDetalhadas;
