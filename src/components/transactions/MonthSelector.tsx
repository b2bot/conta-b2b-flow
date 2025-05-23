
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthSelectorProps {
  currentMonth: Date;
  nextMonth: () => void;
  prevMonth: () => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ 
  currentMonth, 
  nextMonth, 
  prevMonth 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={prevMonth}>
        <ChevronLeft size={18} />
      </Button>
      <div className="text-lg font-medium">
        {format(currentMonth, 'MMMM/yyyy', { locale: ptBR }).toUpperCase()}
      </div>
      <Button variant="outline" onClick={nextMonth}>
        <ChevronRight size={18} />
      </Button>
    </div>
  );
};

export default MonthSelector;
