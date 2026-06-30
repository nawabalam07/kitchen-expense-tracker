import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login          from './pages/Login';
import AdminSignup    from './pages/AdminSignup';
import UserSignup     from './pages/UserSignup';
import AdminDashboard from './pages/AdminDashboard';
import Groups         from './pages/Groups';
import Dashboard      from './pages/Dashboard';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.role !== 'admin') return <Navigate to="/groups" />;
  return children;
};

const MemberRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"                element={<Login />} />
          <Route path="/admin/signup"    element={<AdminSignup />} />
          <Route path="/signup"          element={<UserSignup />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/groups"          element={<MemberRoute><Groups /></MemberRoute>} />
          <Route path="/dashboard/:groupId" element={<MemberRoute><Dashboard /></MemberRoute>} />
          <Route path="*"               element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;