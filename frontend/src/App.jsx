import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Waitlist from './components/Waitlist';
import LegalTerms from './components/LegalTerms';
import { AuthProvider } from './context/AuthContext';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Waitlist />} />
          <Route path="/legal-terms" element={<LegalTerms />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
