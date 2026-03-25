import React, { useState, useEffect } from 'react';
import { Plus, Building, Users, Star, Search, Phone, Mail, MapPin } from 'lucide-react';
import api from '../services/api';
import { formatPKR } from '../utils/currency';
import PageHeader from '../components/UI/PageHeader';
import StatCard from '../components/UI/StatCard';
import DataTable from '../components/UI/DataTable';
import Modal from '../components/UI/Modal';

const AdvancedVendorPage = ({ role }) => {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ 
    name: '', type: 'vendor', outstanding: 0, email: '', phone: '', address: '', rating: 5
  });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors');
      setVendors(res.data);
    } catch (error) {
      setError('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (editId && editId !== 'new') {
        await api.put(`/vendors/${editId}`, form);
      } else {
        await api.post('/vendors', form);
      }
      await fetchVendors();
      resetForm();
    } catch (error) {
      setError('Error saving vendor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', type: 'vendor', outstanding: 0, email: '', phone: '', address: '', rating: 5 });
    setEditId(null);
    setShowModal(false);
  };

  const handleEdit = (vendor) => {
    setForm(vendor);
    setEditId(vendor._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (role !== 'admin') {
      setError('Only admins can delete vendors');
      return;
    }
    
    if (!window.confirm('Delete this record?')) return;
    
    try {
      await api.delete(`/vendors/${id}`);
      fetchVendors();
    } catch (error) {
      setError('Error deleting record');
    }
  };

  const stats = {
    totalVendors: vendors.filter(v => v.type === 'vendor').length,
    totalCustomers: vendors.filter(v => v.type === 'customer').length,
    totalOutstanding: vendors.reduce((sum, v) => sum + (v.outstanding || 0), 0),
    avgRating: vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length || 0
  };

  const columns = [
    { header: 'Type', render: (row) => (
      <span className={`badge ${row.type === 'vendor' ? 'badge-info' : 'badge-success'}`}>
        {row.type === 'vendor' ? 'Vendor' : 'Customer'}
      </span>
    )},
    { header: 'Name', render: (row) => (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-900">{row.name}</span>
        <span className="text-xs text-slate-500">{row.email || 'No email'}</span>
      </div>
    )},
    { header: 'Contact', render: (row) => (
      <div className="flex flex-col text-xs text-slate-600 gap-1">
        <span className="flex items-center gap-1"><Phone size={10} /> {row.phone || 'N/A'}</span>
        <span className="flex items-center gap-1"><MapPin size={10} /> {row.address || 'No address'}</span>
      </div>
    )},
    { header: 'Outstanding', render: (row) => (
      <span className={`font-bold ${row.outstanding > 0 ? 'text-error-600' : 'text-success-600'}`}>
        {formatPKR(row.outstanding || 0)}
      </span>
    )},
    { header: 'Rating', render: (row) => (
      <div className="flex items-center gap-0.5 text-warning-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={12} className={i < (row.rating || 0) ? 'fill-current' : 'text-slate-200'} />
        ))}
      </div>
    )}
  ];

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterType === 'all' || v.type === filterType)
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Vendors & Customers" 
        description="Manage your business ecosystem and maintain strong relationships."
      >
        <button
          onClick={() => { resetForm(); setEditId('new'); setShowModal(true); }}
          className="btn btn-primary shadow-md"
        >
          <Plus size={18} className="mr-2" />
          Add New Record
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Vendors" value={stats.totalVendors} icon={Building} color="bg-primary-500" />
        <StatCard title="Customers" value={stats.totalCustomers} icon={Users} color="bg-secondary-500" />
        <StatCard title="Outstanding" value={formatPKR(stats.totalOutstanding)} icon={Search} color="bg-error-500" />
        <StatCard title="Avg Rating" value={stats.avgRating.toFixed(1)} icon={Star} color="bg-warning-500" />
      </div>

      <div className="card space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Types</option>
            <option value="vendor">Vendors</option>
            <option value="customer">Customers</option>
          </select>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredVendors} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={resetForm} 
        title={editId === 'new' ? 'New Contact' : 'Edit Contact'}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Name</label>
            <input name="name" value={form.name} onChange={handleChange} required className="input" placeholder="Business or Individual name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="input">
              <option value="vendor">Vendor</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="+92 300 1234567" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-700">Address</label>
            <input name="address" value={form.address} onChange={handleChange} className="input" placeholder="Physical or mailing address" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Outstanding Amount</label>
            <input name="outstanding" type="number" value={form.outstanding} onChange={handleChange} className="input" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Rating</label>
            <select name="rating" value={form.rating} onChange={handleChange} className="input">
              {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex gap-4 mt-4">
            <button type="button" onClick={resetForm} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">{loading ? 'Saving...' : 'Save Record'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdvancedVendorPage;
