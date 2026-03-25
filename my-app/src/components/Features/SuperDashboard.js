import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, 
  Zap, PieChart as PieIcon, BarChart3, Activity, Wallet,
  CreditCard, Building, Users, Clock, ArrowRight
} from 'lucide-react';
import StatCard from '../UI/StatCard';
import PageHeader from '../UI/PageHeader';
import api from '../../services/api';
import { formatPKR, formatLargeNumber } from '../../utils/currency';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#06b6d4', '#f97316', '#84cc16'];

const SuperDashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [expensesRes, incomeRes, vendorsRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/income'),
        api.get('/vendors')
      ]);

      const expenses = expensesRes.data;
      const income = incomeRes.data;
      const vendors = vendorsRes.data;
      
      const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = totalIncome - totalExpenses;
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      
      const thisMonthIncome = income.filter(inc => new Date(inc.date).getMonth() === thisMonth)
        .reduce((sum, inc) => sum + inc.amount, 0);
      const lastMonthIncome = income.filter(inc => new Date(inc.date).getMonth() === lastMonth)
        .reduce((sum, inc) => sum + inc.amount, 0);
      
      const thisMonthExpenses = expenses.filter(exp => new Date(exp.date).getMonth() === thisMonth)
        .reduce((sum, exp) => sum + exp.amount, 0);
      const lastMonthExpenses = expenses.filter(exp => new Date(exp.date).getMonth() === lastMonth)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const incomeTrend = lastMonthIncome ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
      const expenseTrend = lastMonthExpenses ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
      const profitTrend = (lastMonthIncome - lastMonthExpenses) ? (((thisMonthIncome - thisMonthExpenses) - (lastMonthIncome - lastMonthExpenses)) / Math.abs(lastMonthIncome - lastMonthExpenses)) * 100 : 0;
      
      const categoryBreakdown = {};
      expenses.forEach(exp => {
        categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
      });
      
      setStats({
        totalIncome,
        totalExpenses,
        netProfit,
        categoryBreakdown,
        activeVendors: vendors.length,
        incomeTrend,
        expenseTrend,
        profitTrend
      });
      
      const monthlyData = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      months.forEach(month => {
        monthlyData[month] = { month, expenses: 0, income: 0, profit: 0 };
      });

      expenses.forEach(exp => {
        const month = new Date(exp.date).toLocaleString('default', { month: 'short' });
        if (monthlyData[month]) monthlyData[month].expenses += exp.amount;
      });
      
      income.forEach(inc => {
        const month = new Date(inc.date).toLocaleString('default', { month: 'short' });
        if (monthlyData[month]) monthlyData[month].income += inc.amount;
      });

      Object.keys(monthlyData).forEach(month => {
        monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expenses;
      });
      
      setChartData(Object.values(monthlyData));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const categoryData = stats?.categoryBreakdown ? 
    Object.entries(stats.categoryBreakdown).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Command Center" 
        description="Monitor your business performance and financial health in real-time."
      >
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['daily', 'monthly', 'yearly'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                timeframe === period 
                  ? 'bg-primary-50 text-primary-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatLargeNumber(stats?.totalIncome || 0)}
          change={stats?.incomeTrend}
          icon={TrendingUp}
          color="bg-secondary-500"
          trend={stats?.incomeTrend >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Total Expenses"
          value={formatLargeNumber(stats?.totalExpenses || 0)}
          change={stats?.expenseTrend}
          icon={TrendingDown}
          color="bg-rose-500"
          trend={stats?.expenseTrend >= 0 ? "down" : "up"}
        />
        <StatCard
          title="Net Profit"
          value={formatLargeNumber(stats?.netProfit || 0)}
          change={stats?.profitTrend}
          icon={DollarSign}
          color="bg-primary-500"
          trend={stats?.profitTrend >= 0 ? "up" : "down"}
        />
        <StatCard
          title="Active Vendors"
          value={stats?.activeVendors || 0}
          icon={Building}
          color="bg-amber-500"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-primary-500" />
                  Revenue vs Expenses
                </h3>
                <p className="text-sm text-slate-500 mt-1">Comparison of income and spending across the year</p>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                    tickFormatter={(value) => `Rs ${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [formatPKR(value), '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
              <PieIcon className="w-5 h-5 mr-2 text-primary-500" />
              Expense Distribution
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {categoryData.slice(0, 5).map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-slate-600">{entry.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatPKR(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & More */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary-500" />
              Profit Stability
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card bg-primary-600 text-white border-none shadow-primary-200 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Ready to grow?</h3>
            <p className="text-primary-100 text-sm">Automate your financial tracking and focus on scaling your business.</p>
          </div>
          <div className="mt-8 space-y-3">
            <Link 
              to="/expenses" 
              className="group flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Add Expense</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
            <Link 
              to="/income" 
              className="group flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5" />
                <span className="font-medium">Add Income</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperDashboard;
