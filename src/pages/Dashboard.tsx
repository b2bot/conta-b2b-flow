
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Plus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Dummy data for the dashboard
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Mock financial data
const generateFinancialData = (month: number, year: number) => {
  // Generate some predictable but varying data based on month/year
  const seed = month + year % 100;
  
  const incomePlanned = 50000 + (seed * 1043) % 20000;
  const incomeReceived = incomePlanned * (0.7 + (seed % 30) / 100);
  
  const expensePlanned = 30000 + (seed * 967) % 15000;
  const expensePaid = expensePlanned * (0.8 + (seed % 20) / 100);
  
  const balance = incomeReceived - expensePaid;
  const expectedBalance = incomePlanned - expensePlanned;
  
  return {
    incomePlanned: incomePlanned.toFixed(2),
    incomeReceived: incomeReceived.toFixed(2),
    incomePercentage: ((incomeReceived / incomePlanned) * 100).toFixed(1),
    expensePlanned: expensePlanned.toFixed(2),
    expensePaid: expensePaid.toFixed(2),
    expensePercentage: ((expensePaid / expensePlanned) * 100).toFixed(1),
    balance: balance.toFixed(2),
    expectedBalance: expectedBalance.toFixed(2)
  };
};

// Generate chart data for 3 months
const generateChartData = (currentMonth: number, currentYear: number) => {
  let data = [];
  for (let i = -1; i <= 1; i++) {
    let month = currentMonth + i;
    let year = currentYear;
    
    if (month < 0) {
      month += 12;
      year -= 1;
    } else if (month > 11) {
      month -= 12;
      year += 1;
    }
    
    const financialData = generateFinancialData(month, year);
    data.push({
      month: `${MONTHS[month].substring(0, 3)}/${year}`,
      planned: parseFloat(financialData.expectedBalance),
      actual: parseFloat(financialData.balance)
    });
  }
  return data;
};

const Dashboard = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
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
  
  const financialData = generateFinancialData(currentMonth, currentYear);
  const chartData = generateChartData(currentMonth, currentYear);
  
  // Calculate the highest value for chart scaling
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(Math.abs(d.planned), Math.abs(d.actual)))
  );
  
  // Function to determine bar height percentage
  const getBarHeight = (value: number) => {
    const percentage = (Math.abs(value) / maxValue) * 100;
    return `${percentage}%`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-dark">Dashboard</h1>
        <Link to="/transacoes">
          <Button className="bg-purple hover:bg-purple/90">
            <Plus size={18} className="mr-2" />
            Nova Transação
          </Button>
        </Link>
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

      {/* Main stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expected result */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              Resultado previsto no mês
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1">
                      <Info size={14} className="text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Receitas previstas - Despesas previstas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple">
              R${parseFloat(financialData.expectedBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        {/* Cash flow chart */}
        <Card className="col-span-1 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fluxo de caixa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-24 w-full flex items-end justify-around px-4">
              {chartData.map((data, index) => (
                <div key={index} className="flex flex-col items-center w-1/3">
                  <div className="relative h-20 w-full flex justify-center items-end">
                    {/* Planned bar */}
                    <div 
                      className="absolute w-4 bg-gray-200 rounded-t-sm" 
                      style={{ 
                        height: getBarHeight(data.planned),
                        bottom: data.planned >= 0 ? '50%' : 'auto',
                        top: data.planned < 0 ? '50%' : 'auto'
                      }}
                    />
                    
                    {/* Actual bar */}
                    <div 
                      className={`absolute w-8 rounded-t-sm ${data.actual >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ 
                        height: getBarHeight(data.actual),
                        bottom: data.actual >= 0 ? '50%' : 'auto',
                        top: data.actual < 0 ? '50%' : 'auto'
                      }}
                    />
                    
                    {/* Centerline */}
                    <div className="absolute h-[1px] w-full bg-gray-300 top-1/2"></div>
                  </div>
                  <span className="text-xs mt-1">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Current balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple">
              R${parseFloat(financialData.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">
              Previsão do mês: R${parseFloat(financialData.expectedBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income/Expense section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recebimentos</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {financialData.incomePercentage}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Recebido</div>
                <div className="font-medium">R${parseFloat(financialData.incomeReceived).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-purple"></div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Previsto</div>
                <div className="font-medium">R${parseFloat(financialData.incomePlanned).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{width: `${financialData.incomePercentage}%`}}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Despesas</span>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                {financialData.expensePercentage}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Pago</div>
                <div className="font-medium">R${parseFloat(financialData.expensePaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 rounded-full bg-purple"></div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Previsto</div>
                <div className="font-medium">R${parseFloat(financialData.expensePlanned).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full" 
                style={{width: `${financialData.expensePercentage}%`}}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
