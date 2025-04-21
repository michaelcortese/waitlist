import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Waitlist from './components/Waitlist';
import LegalTerms from './components/LegalTerms';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Waitlist />} />
          <Route path="/restaurant/:restaurantId" element={<Waitlist />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin/restaurant/:restaurantId" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/legal-terms" element={<LegalTerms />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
