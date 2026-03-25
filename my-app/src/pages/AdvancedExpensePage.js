import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, LayoutGrid, List } from 'lucide-react';
import api from '../services/api';
import { formatPKR } from '../utils/currency';
import ExcelImport from '../components/Features/ExcelImport';
import PageHeader from '../components/UI/PageHeader';
import StatCard from '../components/UI/StatCard';
import DataTable from '../components/UI/DataTable';
import Modal from '../components/UI/Modal';

const AdvancedExpensePage = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    date: '', amount: '', category: '', recipient: '', paymentMethod: '', notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, trend: 0 });

  const categories = ['Office Supplies', 'Travel', 'Meals', 'Utilities', 'Marketing', 'Software', 'Equipment', 'Rent', 'Insurance', 'Other'];
  const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Digital Wallet'];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [expenses]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (error) {
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const thisMonth = expenses.filter(exp => 
      new Date(exp.date).getMonth() === now.getMonth() &&
      new Date(exp.date).getFullYear() === now.getFullYear()
    ).reduce((sum, exp) => sum + exp.amount, 0);
    
    const lastMonth = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1);
    }).reduce((sum, exp) => sum + exp.amount, 0);

    const trend = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    setStats({
      total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      thisMonth,
      trend
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      if (selectedFile) formData.append('invoice', selectedFile);

      if (editId && editId !== 'new') {
        await api.put(`/expenses/${editId}`, formData);
      } else {
        await api.post('/expenses', formData);
      }
      
      await fetchExpenses();
      resetForm();
      setShowModal(false);
    } catch (error) {
      setError('Error saving expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ date: '', amount: '', category: '', recipient: '', paymentMethod: '', notes: '' });
    setEditId(null);
    setSelectedFile(null);
  };

  const handleEdit = (expense) => {
    setForm({
      date: new Date(expense.date).toISOString().split('T')[0],
      amount: expense.amount.toString(),
      category: expense.category,
      recipient: expense.recipient,
      paymentMethod: expense.paymentMethod || '',
      notes: expense.notes || ''
    });
    setEditId(expense._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchExpenses();
      } catch (error) {
        setError('Error deleting expense');
      }
    }
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Recipient', accessor: 'recipient' },
    { header: 'Category', render: (row) => (
      <span className="badge badge-info">{row.category}</span>
    )},
    { header: 'Amount', render: (row) => (
      <span className="font-bold text-slate-900">{formatPKR(row.amount)}</span>
    )},
    { header: 'Method', accessor: 'paymentMethod' },
    { header: 'Status', render: (row) => (
      <span className={`badge ${row.invoice ? 'badge-success' : 'badge-warning'}`}>
        {row.invoice ? 'Documented' : 'Pending'}
      </span>
    )}
  ];

  const filteredExpenses = expenses.filter(exp => 
    exp.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(exp => !filterCategory || exp.category === filterCategory);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Expenses" 
        description="Track and manage your business outflows with precision."
      >
        <button
          onClick={async () => {
            const res = await api.get('/expenses/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'expenses.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
          }}
          className="btn btn-secondary shadow-sm"
        >
          <Download size={18} className="mr-2" />
          Export
        </button>
        <button
          onClick={() => { resetForm(); setEditId('new'); setShowModal(true); }}
          className="btn btn-primary shadow-md"
        >
          <Plus size={18} className="mr-2" />
          Add Expense
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Expenses" value={formatPKR(stats.total)} icon={Search} color="bg-primary-500" />
        <StatCard title="This Month" value={formatPKR(stats.thisMonth)} icon={Search} color="bg-accent-500" change={stats.trend} trend={stats.trend >= 0 ? "up" : "down"} />
        <StatCard title="Records" value={expenses.length} icon={Search} color="bg-secondary-500" />
      </div>

      <div className="card space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input md:w-48"
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <ExcelImport 
              endpoint="/expenses/import"
              onSuccess={() => fetchExpenses()}
              onError={(err) => setError(err)}
              type="expenses"
            />
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredExpenses} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editId === 'new' ? 'New Expense' : 'Edit Expense'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required className="input" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Amount (PKR)</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required className="input" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required className="input">
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Recipient</label>
            <input type="text" value={form.recipient} onChange={(e) => setForm({...form, recipient: e.target.value})} required className="input" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Payment Method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})} className="input">
              <option value="">Select Method</option>
              {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Invoice</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setSelectedFile(e.target.files[0])} className="input p-1" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3} className="input resize-none" />
          </div>
          <div className="md:col-span-2 flex gap-4 mt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">{loading ? 'Saving...' : 'Save Expense'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdvancedExpensePage;
