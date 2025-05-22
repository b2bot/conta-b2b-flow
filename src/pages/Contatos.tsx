
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  ChevronDown,
  Check,
  X,
  Download,
  Upload,
  MoreVertical,
  Calendar as CalendarIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  UserRound
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, parse, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { contactsAPI, transactionsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel } from '@/utils/fileUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { generateInputId, formatCpfCnpj } from '@/utils/formUtils';

// Define contact type
interface Contact {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  tipo: 'Cliente' | 'Fornecedor' | 'Sócio' | 'Outro';
  cpf_cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_nascimento?: string;
  ultima_atualizacao?: string;
}

// Define new contact form
interface ContactForm {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  tipo: 'Cliente' | 'Fornecedor' | 'Sócio' | 'Outro';
  cpf_cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  data_nascimento?: string;
}

// Summary cards type
interface SummaryData {
  devemParaMim: number;
  euDevo: number;
  aniversariantes: Contact[];
}

const Contatos = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    tipo: 'all',
  });
  
  const [newContact, setNewContact] = useState<ContactForm>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    tipo: 'Cliente',
    cpf_cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    data_nascimento: '',
  });
  
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthDateInput, setBirthDateInput] = useState<string>("");

  // Generate unique IDs for form inputs
  const nameId = generateInputId("name");
  const typeId = generateInputId("type");
  const emailId = generateInputId("email");
  const phoneId = generateInputId("phone");
  const cpfCnpjId = generateInputId("cpf_cnpj");
  const companyId = generateInputId("company");
  const birthDateId = generateInputId("birth_date");
  const addressId = generateInputId("address");
  const cityId = generateInputId("city");
  const stateId = generateInputId("state");
  const zipId = generateInputId("zip");

  // Fetch contacts
  const { data: contactsData, isLoading, isError } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      try {
        const response = await contactsAPI.list();
        console.log('Contacts response:', response);
        return response.status === 'success' ? response.contatos : [];
      } catch (err) {
        console.error('Error fetching contacts:', err);
        throw err;
      }
    }
  });

  // Fetch transactions for summary data
  const { data: transactionsData } = useQuery({
    queryKey: ['allTransactions'],
    queryFn: async () => {
      try {
        const response = await transactionsAPI.list();
        return response.status === 'success' ? response.transacoes : [];
      } catch (err) {
        console.error('Error fetching transactions:', err);
        return [];
      }
    }
  });

  // Update birthDate when input changes
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBirthDateInput(value);
    
    if (value.length === 10) { // dd/MM/yyyy
      try {
        const parsedDate = parse(value, "dd/MM/yyyy", new Date());
        if (!isNaN(parsedDate.getTime())) {
          setBirthDate(parsedDate);
        }
      } catch (error) {
        console.error("Invalid date format:", error);
      }
    }
  };

  // Update input when birthDate changes from calendar
  React.useEffect(() => {
    if (birthDate) {
      setBirthDateInput(format(birthDate, "dd/MM/yyyy"));
    }
  }, [birthDate]);

  // Create/update contact mutation
  const saveContactMutation = useMutation({
    mutationFn: (contact: any) => contactsAPI.save(contact),
    onSuccess: (data) => {
      if (data.status === 'success') {
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        toast({
          title: editingContact ? "Contato atualizado com sucesso" : "Contato criado com sucesso",
        });
        setDialogOpen(false);
        resetContactForm();
      } else {
        toast({
          title: "Erro ao salvar contato",
          description: data.message || "Ocorreu um erro ao salvar o contato",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar contato",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      // This is a placeholder - actual implementation would call the delete API
      // return await contactsAPI.delete(id);
      // For now we'll simulate success
      return { status: 'success' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contato excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir contato",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  const contacts = contactsData || [];
  const transactions = transactionsData || [];

  // Calculate summary data
  const summaryData: SummaryData = {
    devemParaMim: 0,
    euDevo: 0,
    aniversariantes: []
  };

  // Calculate financial summaries
  transactions.forEach(transaction => {
    if (transaction.tipo === 'Receita' && !transaction.paid) {
      summaryData.devemParaMim += transaction.valor;
    } else if (transaction.tipo === 'Despesa' && !transaction.paid) {
      summaryData.euDevo += transaction.valor;
    }
  });

  // Find birthday celebrants
  contacts.forEach(contact => {
    if (contact.data_nascimento) {
      const birthDate = new Date(contact.data_nascimento);
      if (isThisMonth(birthDate)) {
        summaryData.aniversariantes.push(contact);
      }
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      tipo: 'all',
    });
  };

  const resetContactForm = () => {
    setNewContact({
      nome: '',
      email: '',
      telefone: '',
      empresa: '',
      tipo: 'Cliente',
      cpf_cnpj: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      data_nascimento: '',
    });
    setBirthDate(undefined);
    setBirthDateInput("");
    setEditingContact(null);
  };

  const filteredContacts = contacts.filter(contact => {
    // Apply filters
    if (filters.tipo !== 'all' && contact.tipo !== filters.tipo) return false;
    return true;
  });
  
  const handleSaveContact = () => {
    if (!newContact.nome) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do contato é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const contactToSave = {
      ...(editingContact ? { id: editingContact.id } : {}),
      nome: newContact.nome,
      email: newContact.email,
      telefone: newContact.telefone,
      empresa: newContact.empresa,
      tipo: newContact.tipo,
      cpf_cnpj: newContact.cpf_cnpj,
      endereco: newContact.endereco,
      cidade: newContact.cidade,
      estado: newContact.estado,
      cep: newContact.cep,
      data_nascimento: birthDate ? format(birthDate, 'yyyy-MM-dd') : newContact.data_nascimento,
    };
    
    saveContactMutation.mutate(contactToSave);
  };
  
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setNewContact({
      nome: contact.nome,
      email: contact.email,
      telefone: contact.telefone,
      empresa: contact.empresa,
      tipo: contact.tipo,
      cpf_cnpj: contact.cpf_cnpj || '',
      endereco: contact.endereco || '',
      cidade: contact.cidade || '',
      estado: contact.estado || '',
      cep: contact.cep || '',
      data_nascimento: contact.data_nascimento || '',
    });
    
    if (contact.data_nascimento) {
      const dateObj = new Date(contact.data_nascimento);
      setBirthDate(dateObj);
      setBirthDateInput(format(dateObj, "dd/MM/yyyy"));
    } else {
      setBirthDate(undefined);
      setBirthDateInput("");
    }
    
    setDialogOpen(true);
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      deleteContactMutation.mutate(id);
    }
  };

  const handleExportContacts = () => {
    // Transform contacts for export
    const dataToExport = filteredContacts.map(contact => ({
      Nome: contact.nome,
      Email: contact.email,
      Telefone: contact.telefone,
      Empresa: contact.empresa,
      Tipo: contact.tipo,
      'CPF/CNPJ': contact.cpf_cnpj || '',
      Endereço: contact.endereco || '',
      Cidade: contact.cidade || '',
      Estado: contact.estado || '',
      CEP: contact.cep || '',
      'Data de Nascimento': contact.data_nascimento ? format(new Date(contact.data_nascimento), 'dd/MM/yyyy') : '',
    }));
    
    exportToExcel(dataToExport, 'contatos');
    
    toast({
      title: "Exportação concluída",
      description: "Os contatos foram exportados com sucesso.",
    });
  };

  // Get badge color based on contact type
  const getContactTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'Cliente':
        return <Badge className="bg-green-500 hover:bg-green-600">{tipo}</Badge>;
      case 'Fornecedor':
        return <Badge className="bg-blue-500 hover:bg-blue-600">{tipo}</Badge>;
      case 'Sócio':
        return <Badge className="bg-purple-500 hover:bg-purple-600">{tipo}</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{tipo}</Badge>;
    }
  };

  // Format currency value
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center">
          <div className="col-span-3">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="p-8 text-center">
      <X className="mx-auto h-12 w-12 text-red-500" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar contatos</h3>
      <p className="mt-1 text-sm text-gray-500">
        Não foi possível carregar a lista de contatos. Tente novamente mais tarde.
      </p>
      <div className="mt-6">
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })}
          className="bg-purple hover:bg-purple/90"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Contatos</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportContacts}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple hover:bg-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={nameId}>Nome*</Label>
                    <Input
                      id={nameId}
                      value={newContact.nome}
                      onChange={(e) => setNewContact({ ...newContact, nome: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={typeId}>Tipo de Contato*</Label>
                    <Select
                      value={newContact.tipo}
                      onValueChange={(value) => setNewContact({ ...newContact, tipo: value as any })}
                    >
                      <SelectTrigger id={typeId}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                        <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="Sócio">Sócio</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={emailId}>Email</Label>
                    <Input
                      id={emailId}
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={phoneId}>Telefone</Label>
                    <Input
                      id={phoneId}
                      value={newContact.telefone}
                      onChange={(e) => setNewContact({ ...newContact, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={cpfCnpjId}>CPF ou CNPJ</Label>
                  <Input
                    id={cpfCnpjId}
                    value={newContact.cpf_cnpj}
                    onChange={(e) => setNewContact({ ...newContact, cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={companyId}>Empresa</Label>
                    <Input
                      id={companyId}
                      value={newContact.empresa}
                      onChange={(e) => setNewContact({ ...newContact, empresa: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={birthDateId}>Data de Nascimento</Label>
                    <div className="flex space-x-2">
                      <Input
                        id={birthDateId}
                        value={birthDateInput}
                        onChange={handleBirthDateChange}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className="px-3">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={birthDate}
                            onSelect={setBirthDate}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={addressId}>Endereço</Label>
                  <Input
                    id={addressId}
                    value={newContact.endereco}
                    onChange={(e) => setNewContact({ ...newContact, endereco: e.target.value })}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={cityId}>Cidade</Label>
                    <Input
                      id={cityId}
                      value={newContact.cidade}
                      onChange={(e) => setNewContact({ ...newContact, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={stateId}>Estado</Label>
                    <Input
                      id={stateId}
                      value={newContact.estado}
                      onChange={(e) => setNewContact({ ...newContact, estado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={zipId}>CEP</Label>
                    <Input
                      id={zipId}
                      value={newContact.cep}
                      onChange={(e) => setNewContact({ ...newContact, cep: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetContactForm();
                }}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-purple hover:bg-purple/90" 
                  onClick={handleSaveContact}
                  disabled={saveContactMutation.isPending}
                >
                  {saveContactMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-2">
                <ArrowUpCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deve para Mim</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {formatCurrency(summaryData.devemParaMim)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-red-100 p-2">
                <ArrowDownCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eu Devo</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {formatCurrency(summaryData.euDevo)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-2">
                <CalendarIcon className="h-6 w-6 text-purple" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aniversariantes do Mês</p>
                <h3 className="text-2xl font-bold text-purple">
                  {summaryData.aniversariantes.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Lista de Contatos
            </h2>
            <Button
              variant="outline"
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          
          {filterOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="type-filter">Tipo</Label>
                <Select
                  value={filters.tipo}
                  onValueChange={(value) => handleFilterChange('tipo', value)}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Cliente">Clientes</SelectItem>
                    <SelectItem value="Fornecedor">Fornecedores</SelectItem>
                    <SelectItem value="Sócio">Sócios</SelectItem>
                    <SelectItem value="Outro">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={resetFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
          
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-medium">
              <div className="col-span-3">Nome</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">CPF/CNPJ</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-2">Telefone</div>
              <div className="col-span-1"></div>
            </div>
            
            {isLoading ? (
              renderLoadingSkeleton()
            ) : isError ? (
              renderErrorState()
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">Nenhum contato encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há contatos com os filtros aplicados.
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="grid grid-cols-12 gap-4 p-4 border-b border-border items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-3 font-medium">
                    {contact.nome}
                  </div>
                  <div className="col-span-2">
                    {getContactTypeBadge(contact.tipo)}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {formatCpfCnpj(contact.cpf_cnpj) || "-"}
                  </div>
                  <div className="col-span-2 text-muted-foreground truncate">
                    {contact.email || "-"}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {contact.telefone || "-"}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600"
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contatos;
