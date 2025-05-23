import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { transactionsAPI } from '@/services/api';
import { calculateTransactionSummary } from '@/utils/fileUtils';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Dashboard = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [financialSummary, setFinancialSummary] = useState({
    received: 0,
    expected: 0,
    paid: 0,
    profit: 0,
    receivedPercentage: 0,
    paidPercentage: 0,
    missingReceived: 0,
    missingPaid: 0,
    expectedExpenses: 0
  });
  const [chartData, setChartData] = useState([]);
  const [monthSummaries, setMonthSummaries] = useState([]);

  const { data: transactionsData = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionsAPI.list();
      return response.status === 'success' ? response.transacoes : [];
    }
  });

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  useEffect(() => {
    if (!transactionsData.length) return;

    const currentMonthTransactions = transactionsData.filter(transaction => {
      const transactionDate = new Date(transaction.data);
      return (
        transactionDate.getMonth() === currentMonth && 
        transactionDate.getFullYear() === currentYear
      );
    });

    const summary = calculateTransactionSummary(currentMonthTransactions);

    const receivedPercentage = summary.expected > 0 
      ? Math.round((summary.received / summary.expected) * 100) 
      : 0;

    const expectedExpenses = currentMonthTransactions
      .filter(t => t.tipo === 'Despesa')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const paidExpenses = currentMonthTransactions
      .filter(t => t.tipo === 'Despesa' && t.paid)
      .reduce((sum, t) => sum + parseFloat(t.valor), 0);

    const paidPercentage = expectedExpenses > 0 
      ? Math.round((paidExpenses / expectedExpenses) * 100) 
      : 0;

    setFinancialSummary({
      ...summary,
      receivedPercentage,
      paidPercentage,
      missingReceived: summary.expected - summary.received,
      missingPaid: expectedExpenses - paidExpenses,
      expectedExpenses
    });

    const cashFlowData = [];
    for (let i = -3; i <= 0; i++) {
      let month = currentMonth + i;
      let year = currentYear;

      if (month < 0) {
        month += 12;
        year -= 1;
      }

      const monthTransactions = transactionsData.filter(transaction => {
        const transactionDate = new Date(transaction.data);
        return (
          transactionDate.getMonth() === month && 
          transactionDate.getFullYear() === year
        );
      });

      const received = monthTransactions
        .filter(t => t.tipo === 'Receita' && t.paid)
        .reduce((sum, t) => sum + parseFloat(t.valor), 0);

      const paid = monthTransactions
        .filter(t => t.tipo === 'Despesa' && t.paid)
        .reduce((sum, t) => sum + parseFloat(t.valor), 0);

      cashFlowData.push({
        month: `${MONTHS[month].substring(0, 3)}/${year.toString().slice(-2)}`,
        received,
        paid,
        balance: received - paid
      });
    }

    setChartData(cashFlowData);

    const summaries = [];
    for (let i = -2; i <= 0; i++) {
      let month = currentMonth + i;
      let year = currentYear;

      if (month < 0) {
        month += 12;
        year -= 1;
      }

      const monthTransactions = transactionsData.filter(transaction => {
        const transactionDate = new Date(transaction.data);
        return (
          transactionDate.getMonth() === month && 
          transactionDate.getFullYear() === year
        );
      });

      const monthSummary = calculateTransactionSummary(monthTransactions);

      summaries.push({
        month: `${MONTHS[month]} ${year}`,
        shortMonth: `${MONTHS[month].substring(0, 3)}/${year}`,
        received: monthSummary.received,
        paid: monthSummary.paid,
        balance: monthSummary.received - monthSummary.paid
      });
    }

    setMonthSummaries(summaries);
  }, [transactionsData, currentMonth, currentYear]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Dashboard</h1>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-border">
        <Button variant="ghost" onClick={prevMonth} className="text-purple">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-purple-dark">{MONTHS[currentMonth]}/{currentYear}</h2>
        <Button variant="ghost" onClick={nextMonth} className="text-purple">
          <ArrowRight size={20} />
        </Button>
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Planned / Actual Progress Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              Previsto / realizado no mês
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1">
                      <Info size={16} className="text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Percentual de recebimentos e pagamentos realizados em relação ao previsto</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {MONTHS[currentMonth]}/{currentYear} - Caixa
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Received progress circle */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${financialSummary.receivedPercentage * 2.83} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-green-500 font-medium">Recebido</span>
                    <span className="text-3xl font-bold">
                      {financialSummary.receivedPercentage}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">Recebido</span>
                    <span className="font-medium">{formatCurrency(financialSummary.received)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-300">Falta</span>
                    <span className="font-medium">{formatCurrency(financialSummary.missingReceived)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Previsto</span>
                    <span className="font-medium">{formatCurrency(financialSummary.expected)}</span>
                  </div>
                </div>
              </div>
              
              {/* Paid progress circle */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${financialSummary.paidPercentage * 2.83} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-red-500 font-medium">Pago</span>
                    <span className="text-3xl font-bold">
                      {financialSummary.paidPercentage}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">Pago</span>
                    <span className="font-medium">{formatCurrency(financialSummary.paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-300">Falta</span>
                    <span className="font-medium">{formatCurrency(financialSummary.missingPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Previsto</span>
                    <span className="font-medium">{formatCurrency(financialSummary.expectedExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Chart Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Fluxo de caixa</CardTitle>
            <div className="text-sm text-muted-foreground">
              {MONTHS[currentMonth]}/{currentYear} - Caixa
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip
                  formatter={(value, name) => {
                    return [formatCurrency(value), name === 'received' ? 'Recebido' : name === 'paid' ? 'Pago' : 'Saldo'];
                  }}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="received" stackId="a" fill="#10B981" name="Recebido" />
                <Bar dataKey="paid" stackId="a" fill="#EF4444" name="Pago" />
                <Line type="monotone" dataKey="balance" stroke="#6B46C1" strokeWidth={2} name="Saldo" dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly summary cards */}
      <div className="grid grid-cols-1 gap-4">
        {monthSummaries.map((summary, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{summary.month}</h3>
                  <p className="text-sm text-muted-foreground">Resumo financeiro</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <span className="text-green-500 font-medium">Recebimentos:</span> {formatCurrency(summary.received)}
                  </p>
                  <p className="text-sm">
                    <span className="text-red-500 font-medium">Despesas:</span> {formatCurrency(summary.paid)}
                  </p>
                  <p className="text-sm font-bold">
                    <span className="text-purple">Saldo:</span> {formatCurrency(summary.balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
