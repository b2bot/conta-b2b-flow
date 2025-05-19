
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

// Mock data for contacts
const INITIAL_CONTACTS = [
  { 
    id: '1', 
    name: 'Eduarda Oliveira', 
    email: 'eduarda@example.com', 
    phone: '(11) 98765-4321', 
    type: 'employee',
    company: 'Lead Clinic'
  },
  { 
    id: '2', 
    name: 'Procfy', 
    email: 'contato@procfy.com', 
    phone: '(11) 3456-7890', 
    type: 'supplier',
    company: 'Procfy Ltda'
  },
  { 
    id: '3', 
    name: 'Dr. Danilo Martins', 
    email: 'danilo@example.com', 
    phone: '(11) 91234-5678', 
    type: 'supplier',
    company: 'Martins & Alves Advocacia'
  },
  { 
    id: '4', 
    name: 'Greatpages', 
    email: 'contato@greatpages.com', 
    phone: '(11) 3333-4444', 
    type: 'supplier',
    company: 'Greatpages Tech' 
  },
  { 
    id: '5', 
    name: 'Cliente ABC', 
    email: 'contato@clienteabc.com', 
    phone: '(11) 5555-6666', 
    type: 'client',
    company: 'Cliente ABC Ltda'
  },
  { 
    id: '6', 
    name: 'Empresa XYZ', 
    email: 'contato@empresaxyz.com', 
    phone: '(11) 7777-8888', 
    type: 'client',
    company: 'Empresa XYZ S.A.'
  }
];

const Contatos = () => {
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'client',
    company: ''
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<typeof newContact | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newId = (Math.max(...contacts.map(c => Number(c.id))) + 1).toString();
      
      setContacts(prev => [...prev, {
        id: newId,
        ...newContact,
        name: newContact.name.trim(),
        email: newContact.email.trim(),
        phone: newContact.phone.trim(),
        company: newContact.company.trim()
      }]);
      
      toast({
        title: "Contato criado com sucesso",
      });
      
      setNewContact({
        name: '',
        email: '',
        phone: '',
        type: 'client',
        company: ''
      });
      
      setDialogOpen(false);
      setIsSubmitting(false);
    }, 500);
  };
  
  const openEditDialog = (contact: typeof newContact) => {
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

    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setContacts(prev => 
        prev.map(contact => 
          contact.id === currentContact.id 
            ? { 
                ...currentContact,
                name: currentContact.name.trim(),
                email: currentContact.email.trim(),
                phone: currentContact.phone.trim(),
                company: currentContact.company.trim()
              } 
            : contact
        )
      );
      
      toast({
        title: "Contato atualizado com sucesso",
      });
      
      setCurrentContact(null);
      setEditDialogOpen(false);
      setIsSubmitting(false);
    }, 500);
  };
  
  const confirmDelete = (id: string) => {
    setContactToDelete(id);
    setAlertDialogOpen(true);
  };
  
  const deleteContact = () => {
    if (!contactToDelete) return;
    
    setContacts(prev => prev.filter(contact => contact.id !== contactToDelete));
    
    toast({
      title: "Contato excluído com sucesso",
    });
    
    setContactToDelete(null);
    setAlertDialogOpen(false);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Contatos</h1>
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
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  placeholder="Nome do contato ou empresa"
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
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    value={newContact.type}
                    onValueChange={(value) => setNewContact({...newContact, type: value})}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
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

        {filteredContacts.length === 0 ? (
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
                <Label htmlFor="edit-name">Nome</Label>
                <Input 
                  id="edit-name" 
                  value={currentContact.name}
                  onChange={(e) => setCurrentContact({...currentContact, name: e.target.value})}
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
                  <Label htmlFor="edit-type">Tipo</Label>
                  <Select 
                    value={currentContact.type}
                    onValueChange={(value) => setCurrentContact({...currentContact, type: value})}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
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
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contatos;
