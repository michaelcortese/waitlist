import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [currentWaitTime, setCurrentWaitTime] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchRestaurantDetails();
    fetchWaitlist();
    // Set up polling for waitlist updates
    const interval = setInterval(fetchWaitlist, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [restaurantId]);

  const fetchRestaurantDetails = async () => {
    try {
      setError('');
      const response = await restaurantService.getRestaurant(restaurantId);
      setRestaurantName(response.name);
      setCurrentWaitTime(response.current_wait_time);
    } catch (err) {
      setError('Failed to load restaurant details');
      console.error('Error fetching restaurant details:', err);
    }
  };

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await restaurantService.getWaitlist(restaurantId);
      setWaitlist(response);
    } catch (err) {
      setError('Failed to load waitlist');
      console.error('Error fetching waitlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (waitlistId, newStatus) => {
    try {
      setIsUpdating(true);
      setError('');
      await restaurantService.updateWaitlistStatus(waitlistId, newStatus);
      await fetchWaitlist(); // Refresh the waitlist
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveFromWaitlist = async (waitlistId) => {
    if (!window.confirm('Are you sure you want to remove this party from the waitlist?')) {
      return;
    }
    try {
      setIsUpdating(true);
      setError('');
      await restaurantService.removeFromWaitlist(waitlistId);
      await fetchWaitlist(); // Refresh the waitlist
    } catch (err) {
      setError('Failed to remove from waitlist');
      console.error('Error removing from waitlist:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (loading && !waitlist.length) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>{restaurantName} - Admin Dashboard</h1>
        <div className="dashboard-actions">
          <div className="current-wait-time">
            Current Wait Time: {currentWaitTime} minutes
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="waitlist-table">
        <table>
          <thead>
            <tr>
              <th>Time Added</th>
              <th>Name</th>
              <th>Party Size</th>
              <th>Phone</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map((entry) => (
              <tr key={entry.id}>
                <td>{formatTime(entry.created_at)}</td>
                <td>{entry.customer_name}</td>
                <td>{entry.party_size}</td>
                <td>{entry.phone_number}</td>
                <td>{entry.notes || '-'}</td>
                <td>
                  <select
                    value={entry.status}
                    onChange={(e) => handleStatusUpdate(entry.id, e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="waiting">Waiting</option>
                    <option value="seated">Seated</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </td>
                <td>
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveFromWaitlist(entry.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Removing...' : 'Remove'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 