import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientNew from './pages/ClientNew';
import ClientDetail from './pages/ClientDetail';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import Vaccines from './pages/Vaccines';
import Services from './pages/Services';
import Loyalty from './pages/Loyalty';
import Settings from './pages/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/new" element={<ClientNew />} />
        <Route path="clients/:clientId" element={<ClientDetail />} />
        <Route path="pets" element={<Pets />} />
        <Route path="pets/:petId" element={<PetDetail />} />
        <Route path="vaccines" element={<Vaccines />} />
        <Route path="services" element={<Services />} />
        <Route path="loyalty" element={<Loyalty />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
