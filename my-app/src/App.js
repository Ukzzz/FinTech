import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdvancedLogin from './components/Auth/AdvancedLogin';
import SuperDashboard from './components/Features/SuperDashboard';
import AdvancedExpensePage from './pages/AdvancedExpensePage';
import AdvancedIncomePage from './pages/AdvancedIncomePage';
import AdvancedVendorPage from './pages/AdvancedVendorPage';
import AdvancedReportsPage from './pages/AdvancedReportsPage';
import Navbar from './components/Common/Navbar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('staff');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUserRole(user.role);
    localStorage.setItem('role', user.role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole('staff');
  };

  if (!isAuthenticated) {
    return <AdvancedLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onLogout={handleLogout} role={userRole} />
      <main className="container animate-in fade-in duration-500">
        <Routes>
          <Route path="/dashboard" element={<SuperDashboard role={userRole} />} />
          <Route path="/expenses" element={<AdvancedExpensePage role={userRole} />} />
          <Route path="/income" element={<AdvancedIncomePage role={userRole} />} />
          <Route path="/vendors" element={<AdvancedVendorPage role={userRole} />} />
          <Route path="/reports" element={<AdvancedReportsPage role={userRole} />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;