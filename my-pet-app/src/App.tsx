import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Home from './pages/Home';
import MyPets from './pages/MyPets';
import PetDetail from './pages/PetDetail';
import Vaccines from './pages/Vaccines';
import Loyalty from './pages/Loyalty';
import Profile from './pages/Profile';

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
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Home />} />
        <Route path="pets" element={<MyPets />} />
        <Route path="pets/:petId" element={<PetDetail />} />
        <Route path="vaccines" element={<Vaccines />} />
        <Route path="loyalty" element={<Loyalty />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
