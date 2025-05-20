
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  data: any[];
  errors?: string[];
}

/**
 * Import data from Excel or CSV file
 */
export const importFromFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        resolve({
          success: true,
          data: jsonData
        });
      } catch (error) {
        console.error('Error parsing file:', error);
        reject({
          success: false,
          data: [],
          errors: ['Erro ao processar arquivo. Certifique-se que é um arquivo Excel ou CSV válido.']
        });
      }
    };
    
    reader.onerror = () => {
      reject({
        success: false,
        data: [],
        errors: ['Erro ao ler o arquivo.']
      });
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * Export data to Excel file
 */
export const exportToExcel = (data: any[], filename: string): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
  
  // Generate and download file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
