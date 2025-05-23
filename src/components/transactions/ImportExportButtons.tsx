
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import FileImport from '@/components/FileImport';

interface ImportExportButtonsProps {
  onExport: () => void;
  onImportSuccess: (data: any[]) => void;
  importDialogOpen: boolean;
  setImportDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({ 
  onExport, 
  onImportSuccess,
  importDialogOpen,
  setImportDialogOpen
}) => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline"
        className="bg-white"
        onClick={onExport}
      >
        <FileDown size={18} className="mr-2" />
        Exportar
      </Button>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-white">
            <FileUp size={18} className="mr-2" />
            Importar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Transações</DialogTitle>
            <DialogDescription>
              Importe transações a partir de um arquivo Excel ou CSV.
            </DialogDescription>
          </DialogHeader>
          <FileImport onImportSuccess={onImportSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExportButtons;
