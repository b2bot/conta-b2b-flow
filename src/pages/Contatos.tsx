import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Loader2,
  X,
  Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import FileImport from '@/components/FileImport';
import { exportToExcel } from '@/utils/fileUtils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const API_BASE_URL = 'https://sistema.vksistemas.com.br/api';

const contactsAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/listar-contatos.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  },
  save: async (contato: any) => {
    const res = await fetch(`${API_BASE_URL}/salvar-contato.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contato),
    });
    return await res.json();
  }
};

// Define type for contact
interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  company: string;
}

// Define type for new contact form
interface ContactForm {
  name: string;
  email: string;
  phone: string;
  type: string;
  company: string;
}

const Contatos = () => {
  const [newContact, setNewContact] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    type: 'client',
    company: ''
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contactsData, isLoading, isError, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      try {
        console.log('Fetching contacts...');
        const response = await contactsAPI.list();
        console.log('Response:', response);
        return response.success ? response.contacts : [];
      } catch (err) {
        console.error('Error fetching contacts:', err);
        throw err;
      }
    }
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: (contact: ContactForm) => contactsAPI.save(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contato criado com sucesso",
      });
      setDialogOpen(false);
      resetContactForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar contato",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: (contact: Contact) => contactsAPI.save(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contato atualizado com sucesso",
      });
      setEditDialogOpen(false);
      setCurrentContact(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar contato",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => contactsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contato excluído com sucesso",
      });
      setAlertDialogOpen(false);
      setContactToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir contato",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Bulk import contacts mutation
  const bulkImportMutation = useMutation({
    mutationFn: (contacts: ContactForm[]) => {
      // Create a promise for each contact
      const promises = contacts.map(contact => contactsAPI.save(contact));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setImportDialogOpen(false);
      toast({
        title: "Contatos importados com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao importar contatos",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  const contacts = contactsData || [];

  const resetContactForm = () => {
    setNewContact({
      name: '',
      email: '',
      phone: '',
      type: 'client',
      company: ''
    });
  };

  const filteredContacts = contacts.filter(contact => {
    // Filter by tab
    if (activeTab !== 'all' && contact.type !== activeTab) return false;
    
    // Filter by search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.company.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const handleCreateContact = () => {
    if (!newContact.name.trim()) {
      toast({
        title: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    createContactMutation.mutate({
      ...newContact,
      name: newContact.name.trim(),
      email: newContact.email.trim(),
      phone: newContact.phone.trim(),
      company: newContact.company.trim()
    });
  };
  
  const openEditDialog = (contact: Contact) => {
    setCurrentContact(contact);
    setEditDialogOpen(true);
  };
  
  const handleUpdateContact = () => {
    if (!currentContact || !currentContact.name.trim()) {
      toast({
        title: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    updateContactMutation.mutate({
      ...currentContact,
      name: currentContact.name.trim(),
      email: currentContact.email.trim(),
      phone: currentContact.phone.trim(),
      company: currentContact.company.trim()
    });
  };
  
  const confirmDelete = (id: string) => {
    setContactToDelete(id);
    setAlertDialogOpen(true);
  };
  
  const deleteContact = () => {
    if (!contactToDelete) return;
    deleteContactMutation.mutate(contactToDelete);
  };
  
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'client': return 'Cliente';
      case 'supplier': return 'Fornecedor';
      case 'employee': return 'Funcionário';
      default: return 'Outro';
    }
  };
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'client': return 'bg-green-100 text-green-800';
      case 'supplier': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImportContacts = (data: any[]) => {
    // Map imported data to contact format
    const contacts: ContactForm[] = data.map(item => ({
      name: item.nome || item.name || '',
      email: item.email || '',
      phone: item.telefone || item.phone || '',
      type: getContactTypeFromString(item.tipo || item.type || ''),
      company: item.empresa || item.company || ''
    }));

    // Validate contacts
    const validContacts = contacts.filter(contact => contact.name.trim() !== '');
    
    if (validContacts.length === 0) {
      toast({
        title: "Erro na importação",
        description: "Nenhum contato válido encontrado no arquivo. O nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Import contacts
    bulkImportMutation.mutate(validContacts);
  };

  const getContactTypeFromString = (typeString: string): string => {
    const typeStringLower = typeString.toLowerCase();
    
    if (typeStringLower.includes('cliente') || typeStringLower.includes('client')) {
      return 'client';
    } else if (typeStringLower.includes('fornecedor') || typeStringLower.includes('supplier')) {
      return 'supplier';
    } else if (typeStringLower.includes('funcionário') || typeStringLower.includes('employee')) {
      return 'employee';
    }
    
    // Default to client
    return 'client';
  };

  const handleExportContacts = () => {
    // Transform contacts for export
    const dataToExport = filteredContacts.map(contact => ({
      Nome: contact.name,
      Email: contact.email,
      Telefone: contact.phone,
      Empresa: contact.company,
      Tipo: getTypeLabel(contact.type)
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
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-8 w-8 rounded-full" />
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar/Exportar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex flex-col gap-2">
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar planilha
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={handleExportContacts}
                  disabled={filteredContacts.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar contatos
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple hover:bg-purple/90">
                <Plus size={18} className="mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-purple-dark">Novo Contato</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    placeholder="Nome do contato ou empresa"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={newContact.phone}
                      onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo <span className="text-red-500">*</span></Label>
                    <Select 
                      value={newContact.type}
                      onValueChange={(value) => setNewContact({...newContact, type: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="supplier">Fornecedor</SelectItem>
                        <SelectItem value="employee">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input 
                      id="company" 
                      value={newContact.company}
                      onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button 
                  className="bg-purple hover:bg-purple/90" 
                  onClick={handleCreateContact}
                  disabled={createContactMutation.isPending}
                >
                  {createContactMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : 'Criar Contato'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="client">Clientes</TabsTrigger>
            <TabsTrigger value="supplier">Fornecedores</TabsTrigger>
            <TabsTrigger value="employee">Funcionários</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input 
            placeholder="Buscar contato..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-gray-50 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Nome</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Telefone</div>
          <div className="col-span-2">Empresa</div>
          <div className="col-span-1">Tipo</div>
          <div className="col-span-1"></div>
        </div>

        {isLoading ? (
          renderLoadingSkeleton()
        ) : isError ? (
          renderErrorState()
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchTerm 
              ? "Nenhum contato encontrado para essa busca." 
              : "Nenhum contato encontrado. Cadastre seu primeiro contato!"}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-gray-50 transition-colors items-center text-sm"
            >
              <div className="col-span-3 font-medium">
                {contact.name}
              </div>
              <div className="col-span-3 text-muted-foreground">
                {contact.email}
              </div>
              <div className="col-span-2">
                {contact.phone}
              </div>
              <div className="col-span-2 text-muted-foreground">
                {contact.company}
              </div>
              <div className="col-span-1">
                <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(contact.type)}`}>
                  {getTypeLabel(contact.type)}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => openEditDialog(contact)}
                      className="cursor-pointer"
                    >
                      <Pencil size={14} className="mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => confirmDelete(contact.id)}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Contact Dialog */}
      {currentContact && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-purple-dark">Editar Contato</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome <span className="text-red-500">*</span></Label>
                <Input 
                  id="edit-name" 
                  value={currentContact.name}
                  onChange={(e) => setCurrentContact({...currentContact, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email"
                    value={currentContact.email}
                    onChange={(e) => setCurrentContact({...currentContact, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input 
                    id="edit-phone" 
                    value={currentContact.phone}
                    onChange={(e) => setCurrentContact({...currentContact, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Tipo <span className="text-red-500">*</span></Label>
                  <Select 
                    value={currentContact.type}
                    onValueChange={(value) => setCurrentContact({...currentContact, type: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="supplier">Fornecedor</SelectItem>
                      <SelectItem value="employee">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Empresa</Label>
                  <Input 
                    id="edit-company" 
                    value={currentContact.company}
                    onChange={(e) => setCurrentContact({...currentContact, company: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button 
                className="bg-purple hover:bg-purple/90" 
                onClick={handleUpdateContact}
                disabled={updateContactMutation.isPending}
              >
                {updateContactMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-purple-dark">Importar Contatos</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FileImport 
              onImportSuccess={handleImportContacts}
              isLoading={bulkImportMutation.isPending}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
              <p className="font-medium mb-1">Formato esperado:</p>
              <p>A planilha deve conter colunas com os seguintes cabeçalhos:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                <li>nome ou name (obrigatório)</li>
                <li>email</li>
                <li>telefone ou phone</li>
                <li>empresa ou company</li>
                <li>tipo ou type (cliente/fornecedor/funcionário)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={deleteContact}
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contatos;
