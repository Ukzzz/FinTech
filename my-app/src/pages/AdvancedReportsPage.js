import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieIcon,
  Activity, Target, Zap, Clock
} from 'lucide-react';
import api from '../services/api';
import { formatPKR, formatLargeNumber } from '../utils/currency';
import PageHeader from '../components/UI/PageHeader';
import StatCard from '../components/UI/StatCard';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

const AdvancedReportsPage = () => {
  const [reports, setReports] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [timeframe, setTimeframe] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    fetchReportsData();
  }, [timeframe]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const [reportRes, expensesRes, incomeRes] = await Promise.all([
        api.get(`/reports?type=${timeframe}`),
        api.get('/expenses'),
        api.get('/income')
      ]);

      const expensesData = expensesRes.data;
      const incomeData = incomeRes.data;
      
      const totalIncome = incomeData.reduce((sum, inc) => sum + inc.amount, 0);
      const totalExpenses = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = totalIncome - totalExpenses;
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      
      const thisMonthProfit = incomeData.filter(inc => new Date(inc.date).getMonth() === thisMonth)
        .reduce((sum, inc) => sum + inc.amount, 0) - 
        expensesData.filter(exp => new Date(exp.date).getMonth() === thisMonth)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const lastMonthProfit = incomeData.filter(inc => new Date(inc.date).getMonth() === lastMonth)
        .reduce((sum, inc) => sum + inc.amount, 0) - 
        expensesData.filter(exp => new Date(exp.date).getMonth() === lastMonth)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const profitTrend = lastMonthProfit ? ((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100 : 0;
      
      setReports({
        ...reportRes.data,
        totalIncome,
        totalExpenses,
        netProfit,
        profitTrend
      });
      setExpenses(expensesData);
      setIncome(incomeData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    if (!expenses.length && !income.length) return [];

    const monthlyData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    [...expenses, ...income].forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          month: `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`, 
          sortKey: date.getFullYear() * 100 + date.getMonth(),
          expenses: 0, income: 0, profit: 0, transactions: 0 
        };
      }
      if (item.category) { // expense
        monthlyData[monthKey].expenses += parseFloat(item.amount) || 0;
      } else { // income
        monthlyData[monthKey].income += parseFloat(item.amount) || 0;
      }
      monthlyData[monthKey].transactions += 1;
    });

    Object.values(monthlyData).forEach(m => m.profit = m.income - m.expenses);
    return Object.values(monthlyData).sort((a, b) => a.sortKey - b.sortKey);
  };

  const getCategoryData = () => {
    const totals = {};
    expenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const chartData = processChartData();
  const categoryData = getCategoryData();

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Financial Reports" 
        description="Comprehensive insights into your business performance and growth."
      >
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
          {['daily', 'monthly', 'yearly'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                timeframe === period ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Revenue" value={formatPKR(reports?.totalIncome || 0)} icon={TrendingUp} color="bg-primary-500" />
        <StatCard title="Expenses" value={formatPKR(reports?.totalExpenses || 0)} icon={TrendingDown} color="bg-rose-500" />
        <StatCard title="Net Profit" value={formatPKR(reports?.netProfit || 0)} icon={DollarSign} color="bg-secondary-500" change={reports?.profitTrend} trend={reports?.profitTrend >= 0 ? "up" : "down"} />
        <StatCard title="Efficiency" value={`${reports?.netProfit > 0 ? ((reports?.netProfit / reports?.totalIncome) * 100).toFixed(1) : 0}%`} icon={Zap} color="bg-accent-500" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'categories', label: 'Categories', icon: PieIcon },
          { id: 'efficiency', label: 'Efficiency', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={`btn ${selectedReport === tab.id ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {selectedReport === 'overview' && (
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue vs Expenses</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(val) => formatLargeNumber(val)} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(val) => formatPKR(val)}
                  />
                  <Bar dataKey="income" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} name="Income" />
                  <Bar dataKey="expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={32} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedReport === 'categories' && (
          <>
            <div className="card">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Expense Distribution</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Category Breakdown</h3>
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="font-medium text-slate-700">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatPKR(cat.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedReport === 'efficiency' && (
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Profit Margin Trend</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 6, fill: '#10B981', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedReportsPage;
