import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { formatPKR } from '../utils/currency';
import ExcelImport from '../components/Features/ExcelImport';
import PageHeader from '../components/UI/PageHeader';
import StatCard from '../components/UI/StatCard';
import DataTable from '../components/UI/DataTable';
import Modal from '../components/UI/Modal';

const AdvancedIncomePage = () => {
  const [income, setIncome] = useState([]);
  const [form, setForm] = useState({
    date: '', source: '', amount: '', paymentMethod: '', notes: '', recurring: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, trend: 0, recurring: 0 });

  const incomeSources = ['Sales Revenue', 'Service Income', 'Investment Returns', 'Rental Income', 'Consulting', 'Freelance', 'Royalties', 'Interest', 'Dividends', 'Other'];
  const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Digital Wallet', 'Cryptocurrency'];

  useEffect(() => {
    fetchIncome();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [income]);

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const res = await api.get('/income');
      setIncome(res.data);
    } catch (error) {
      setError('Failed to fetch income records');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const thisMonth = income.filter(inc => 
      new Date(inc.date).getMonth() === now.getMonth() &&
      new Date(inc.date).getFullYear() === now.getFullYear()
    ).reduce((sum, inc) => sum + inc.amount, 0);
    
    const lastMonth = income.filter(inc => {
      const incDate = new Date(inc.date);
      return incDate.getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1);
    }).reduce((sum, inc) => sum + inc.amount, 0);

    const trend = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    const recurringTotal = income.filter(inc => inc.recurring).reduce((sum, inc) => sum + inc.amount, 0);

    setStats({
      total: income.reduce((sum, inc) => sum + inc.amount, 0),
      thisMonth,
      trend,
      recurring: recurringTotal
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editId && editId !== 'new') {
        await api.put(`/income/${editId}`, form);
      } else {
        await api.post('/income', form);
      }
      
      await fetchIncome();
      resetForm();
      setShowModal(false);
    } catch (error) {
      setError('Error saving income record');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ date: '', source: '', amount: '', paymentMethod: '', notes: '', recurring: false });
    setEditId(null);
  };

  const handleEdit = (record) => {
    setForm({
      date: new Date(record.date).toISOString().split('T')[0],
      source: record.source,
      amount: record.amount.toString(),
      paymentMethod: record.paymentMethod || '',
      notes: record.notes || '',
      recurring: record.recurring || false
    });
    setEditId(record._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this income record?')) {
      try {
        await api.delete(`/income/${id}`);
        fetchIncome();
      } catch (error) {
        setError('Error deleting income');
      }
    }
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Source', accessor: 'source' },
    { header: 'Amount', render: (row) => (
      <span className="font-bold text-slate-900">{formatPKR(row.amount)}</span>
    )},
    { header: 'Method', accessor: 'paymentMethod' },
    { header: 'Type', render: (row) => (
      row.recurring ? 
      <span className="badge badge-info flex items-center gap-1 w-fit">
        <RefreshCw size={12} /> Recurring
      </span> : 
      <span className="badge badge-secondary">One-time</span>
    )},
    { header: 'Notes', accessor: 'notes', truncate: true }
  ];

  const filteredIncome = income.filter(inc => 
    inc.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(inc => !filterSource || inc.source === filterSource);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Income" 
        description="Monitor your revenue streams and financial growth."
      >
        <button
          onClick={async () => {
            const res = await api.get('/income/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'income.xlsx');
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
          Add Income
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={formatPKR(stats.total)} icon={Search} color="bg-primary-500" />
        <StatCard title="This Month" value={formatPKR(stats.thisMonth)} icon={Search} color="bg-accent-500" change={stats.trend} trend={stats.trend >= 0 ? "up" : "down"} />
        <StatCard title="Recurring" value={formatPKR(stats.recurring)} icon={RefreshCw} color="bg-secondary-500" />
        <StatCard title="Records" value={income.length} icon={Search} color="bg-slate-500" />
      </div>

      <div className="card space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search income..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="input md:w-48"
            >
              <option value="">All Sources</option>
              {incomeSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ExcelImport 
              endpoint="/income/import"
              onSuccess={() => fetchIncome()}
              onError={(err) => setError(err)}
              type="income"
            />
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredIncome} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editId === 'new' ? 'New Income Record' : 'Edit Income Record'}
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
            <label className="text-sm font-semibold text-slate-700">Income Source</label>
            <select value={form.source} onChange={(e) => setForm({...form, source: e.target.value})} required className="input">
              <option value="">Select Source</option>
              {incomeSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Payment Method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})} className="input">
              <option value="">Select Method</option>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="recurring"
              checked={form.recurring}
              onChange={(e) => setForm({...form, recurring: e.target.checked})}
              className="w-5 h-5 accent-primary-600 rounded"
            />
            <label htmlFor="recurring" className="text-sm font-medium text-slate-700 select-none">
              This is a recurring income record
            </label>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3} className="input resize-none" placeholder="Add any additional details..." />
          </div>
          <div className="md:col-span-2 flex gap-4 mt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">{loading ? 'Saving...' : 'Save Income'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdvancedIncomePage;
