
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/fileUtils';

interface FinancialSummaryProps {
  financialSummary: {
    received: number;
    expected: number;
    paid: number;
    profit: number;
  }
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ financialSummary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-500">Recebido</div>
          <div className="text-2xl font-bold text-green-500">
            {formatCurrency(financialSummary.received)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-500">Previsto</div>
          <div className="text-2xl font-bold text-blue-500">
            {formatCurrency(financialSummary.expected)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-500">Pago</div>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(financialSummary.paid)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-500">Lucro</div>
          <div className={`text-2xl font-bold ${financialSummary.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(financialSummary.profit)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinancialSummary;
