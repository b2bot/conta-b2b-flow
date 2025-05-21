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
  Upload
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { format, addMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { contactsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel } from '@/utils/fileUtils';

// Define contact type
interface Contact {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  tipo: 'Cliente' | 'Fornecedor';
}

// Define new contact form
interface ContactForm {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  tipo: 'Cliente' | 'Fornecedor';
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
  });
  
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contactsData, isLoading, isError } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      try {
        const response = await contactsAPI.list();
        return response.status === 'success' ? response.contatos : [];
      } catch (err) {
        console.error('Error fetching contacts:', err);
        throw err;
      }
    }
  });

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

  const contacts = contactsData || [];

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
    });
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
    });
    setDialogOpen(true);
  };

  const handleExportContacts = () => {
    // Transform contacts for export
    const dataToExport = filteredContacts.map(contact => ({
      Nome: contact.nome,
      Email: contact.email,
      Telefone: contact.telefone,
      Empresa: contact.empresa,
      Tipo: contact.tipo,
    }));
    
    exportToExcel(dataToExport, 'contatos');
    
    toast({
      title: "Exportação concluída",
      description: "Os contatos foram exportados com sucesso.",
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
          <div className="col-span-3">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-8 w-16 rounded-md" />
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
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newContact.nome}
                    onChange={(e) => setNewContact({ ...newContact, nome: e.target.value })}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="Ex: joao@empresa.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newContact.telefone}
                    onChange={(e) => setNewContact({ ...newContact, telefone: e.target.value })}
                    placeholder="Ex: (11) 98765-4321"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={newContact.empresa}
                    onChange={(e) => setNewContact({ ...newContact, empresa: e.target.value })}
                    placeholder="Ex: Empresa S.A."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newContact.tipo}
                    onValueChange={(value) => setNewContact({ ...newContact, tipo: value as 'Cliente' | 'Fornecedor' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Cliente">Clientes</SelectItem>
                    <SelectItem value="Fornecedor">Fornecedores</SelectItem>
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
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Telefone</div>
              <div className="col-span-2">Empresa</div>
              <div className="col-span-2"></div>
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
                  <div className="col-span-3 text-muted-foreground">
                    {contact.email}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {contact.telefone}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {contact.empresa}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditContact(contact)}
                    >
                      Editar
                    </Button>
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
