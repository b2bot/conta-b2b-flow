
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { importFromFile, ImportResult } from '@/utils/fileUtils';

interface FileImportProps {
  onImportSuccess: (data: any[]) => void;
  onImportError?: (errors: string[]) => void;
  isLoading?: boolean;
  label?: string;
  accept?: string;
}

const FileImport: React.FC<FileImportProps> = ({
  onImportSuccess,
  onImportError,
  isLoading = false,
  label = "Importar planilha",
  accept = ".xlsx,.csv"
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileImportLoading, setFileImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setFileImportLoading(true);
    try {
      const result: ImportResult = await importFromFile(file);
      
      if (result.success && result.data.length > 0) {
        onImportSuccess(result.data);
        toast({
          title: "Importação bem-sucedida",
          description: `${result.data.length} registros importados`,
        });
      } else {
        throw new Error('Nenhum dado válido encontrado no arquivo.');
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao importar arquivo.';
      
      if (onImportError) {
        onImportError([errorMessage]);
      }
      
      toast({
        title: "Erro na importação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFileImportLoading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="file-upload">{label}</Label>
        {file && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFile}
            disabled={fileImportLoading}
          >
            <X size={16} />
            <span className="sr-only">Remover arquivo</span>
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          disabled={isLoading || fileImportLoading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || fileImportLoading}
          className="w-full"
        >
          {fileImportLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : file ? (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {file.name}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Selecionar arquivo
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Formatos aceitos: Excel (.xlsx) e CSV (.csv)
      </p>
    </div>
  );
};

export default FileImport;
