import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { useState } from 'react';

// Add Vite env type definition
interface ImportMetaEnv {
  VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface WaitlistFormData {
  customerName: string;
  partySize: number;
  phoneNumber: string;
  notes?: string;
}

function WaitlistPage() {
  const { restaurantId } = useParams();
  const [formData, setFormData] = useState<WaitlistFormData>({
    customerName: '',
    partySize: 1,
    phoneNumber: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          restaurantId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to join waitlist');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Success! 🎉</h2>
          <p className="text-gray-600">You've been added to the waitlist. We'll contact you shortly!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Join the Waitlist</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Party Size</label>
            <input
              type="number"
              required
              min="1"
              className="w-full p-2 border rounded"
              value={formData.partySize}
              onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              required
              className="w-full p-2 border rounded"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              className="w-full p-2 border rounded"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/waitlist/:restaurantId" element={<WaitlistPage />} />
      </Routes>
    </Router>
  );
}

export default App; 