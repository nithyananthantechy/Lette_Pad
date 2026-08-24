// src/App.jsx — Router + Route Guard
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Landing        from './pages/Landing';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard      from './pages/Dashboard';
import LetterDesigner from './pages/LetterDesigner';
import Profiles       from './pages/Profiles';
import Letters        from './pages/Letters';
import AuditLog       from './pages/AuditLog';
import Verify         from './pages/Verify';
import Intelligence   from './pages/Intelligence';
import Settings       from './pages/Settings';
import NotFound       from './pages/NotFound';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-tamil">ஏற்றுகிறது...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// Public-only route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const App = () => (
  <Routes>
    {/* Public */}
    <Route path="/"                 element={<Landing />} />
    <Route path="/verify/:documentId" element={<Verify />} />
    <Route path="/login"            element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register"         element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/forgot-password"  element={<PublicRoute><ForgotPassword /></PublicRoute>} />

    {/* Protected */}
    <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/intelligence"    element={<ProtectedRoute><Intelligence /></ProtectedRoute>} />
    <Route path="/profiles"        element={<ProtectedRoute><Profiles /></ProtectedRoute>} />
    <Route path="/letters"         element={<ProtectedRoute><Letters /></ProtectedRoute>} />
    <Route path="/letters/new"     element={<ProtectedRoute><LetterDesigner /></ProtectedRoute>} />
    <Route path="/letters/:id/edit" element={<ProtectedRoute><LetterDesigner /></ProtectedRoute>} />
    <Route path="/settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/audit"           element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
