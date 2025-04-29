import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantService } from '../services/restaurantService';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import './AdminDashboard.css';

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
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAdjustingWaitTime, setIsAdjustingWaitTime] = useState(false);

  // Fetch functions
  const fetchRestaurantDetails = useCallback(async () => {
    try {
      setError('');
      const response = await restaurantService.getRestaurantInfo(restaurantId);
      setRestaurantName(response.name);
      setCurrentWaitTime(response.current_wait_time);
    } catch (err) {
      setError('Failed to load restaurant details');
      console.error('Error fetching restaurant details:', err);
    }
  }, [restaurantId]);

  const fetchWaitlist = useCallback(async () => {
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
  }, [restaurantId]);

  // Socket.IO setup
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:8080', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setIsConnected(true);
      socketInstance.emit('join-restaurant', restaurantId);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setError('Failed to connect to real-time updates');
    });

    socketInstance.on('waitlist-update', (updatedWaitlist) => {
      console.log('📝 Received waitlist update:', updatedWaitlist);
      setWaitlist(updatedWaitlist);
      setLoading(false);
    });

    socketInstance.on('restaurant-update', (restaurantData) => {
      console.log('🏪 Received restaurant update:', restaurantData);
      setRestaurantName(restaurantData.name);
      setCurrentWaitTime(restaurantData.current_wait_time);
    });

    setSocket(socketInstance);

    // Initial data fetch
    fetchRestaurantDetails();
    fetchWaitlist();

    return () => {
      if (socketInstance.connected) {
        socketInstance.emit('leave-restaurant', restaurantId);
        socketInstance.disconnect();
      }
    };
  }, [restaurantId, fetchRestaurantDetails, fetchWaitlist]);

  // Status update handler
  const handleStatusUpdate = async (id, newStatus) => {
    setIsUpdating(true);
    try {
      await restaurantService.updateWaitlistStatus(id, newStatus);
      if (!isConnected) {
        // Fallback to manual fetch if WebSocket is not connected
        await fetchWaitlist();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
      await fetchWaitlist();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdjustWaitTime = async (adjustment) => {
    setIsAdjustingWaitTime(true);
    setError('');
    try {
      const response = await restaurantService.adjustWaitTime(restaurantId, adjustment);
      console.log('⏱️ Wait time adjusted:', response);
      
      // Update the current wait time from the response
      if (response.current_wait_time !== undefined) {
        setCurrentWaitTime(response.current_wait_time);
      }
      
      // If WebSocket is not connected, manually fetch the waitlist
      if (!isConnected) {
        await fetchWaitlist();
      }
    } catch (error) {
      console.error('Error adjusting wait time:', error);
      setError('Failed to adjust wait time. Please try again.');
      // Refresh the data to ensure consistency
      await fetchRestaurantDetails();
      await fetchWaitlist();
    } finally {
      setIsAdjustingWaitTime(false);
    }
  };

  const handleLogout = () => {
    if (socket?.connected) {
      socket.emit('leave-restaurant', restaurantId);
      socket.disconnect();
    }
    logout();
    navigate('/login');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  // Loading state
  if (loading && !waitlist.length) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>{restaurantName} - Admin Dashboard</h1>
        <div className="dashboard-actions">
          <div className="wait-time-controls">
            <div className="current-wait-time">
              Current Wait Time: {currentWaitTime} minutes
            </div>
            <div className="wait-time-buttons">
              <button 
                className="adjust-button decrease"
                onClick={() => handleAdjustWaitTime(-5)}
                disabled={isAdjustingWaitTime || currentWaitTime <= 0}
              >
                -5 min
              </button>
              <button 
                className="adjust-button increase"
                onClick={() => handleAdjustWaitTime(5)}
                disabled={isAdjustingWaitTime}
              >
                +5 min
              </button>
            </div>
          </div>
          {!isConnected && (
            <div className="connection-status error">
              ⚠️ Real-time updates disconnected
            </div>
          )}
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
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      if (window.confirm(
                        `Are you sure you want to mark ${entry.customer_name} as ${newStatus.toUpperCase()}? ` +
                        'This will remove them from the waitlist.'
                      )) {
                        handleStatusUpdate(entry.id, newStatus);
                      }
                    }}
                    disabled={isUpdating}
                    className={`status-select status-${entry.status}`}
                  >
                    <option value="waiting">Waiting</option>
                    <option value="seated">Seated</option>
                    <option value="no_show">No Show</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 