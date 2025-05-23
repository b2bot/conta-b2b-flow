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

// Dummy data for the dashboard
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
      {/* ...rest of JSX remains unchanged */}
    </div>
  );
};

export default Dashboard;
