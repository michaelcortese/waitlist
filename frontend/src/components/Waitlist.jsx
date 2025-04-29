import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { restaurantService } from '../services/restaurantService';
import io from 'socket.io-client';
import './Waitlist.css';

const Waitlist = () => {
  const { restaurantId } = useParams();
  const [waitlistEntry, setWaitlistEntry] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancellationAnimation, setShowCancellationAnimation] = useState(false);
  const [showReadyAnimation, setShowReadyAnimation] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showTimeChange, setShowTimeChange] = useState(null);
  const countdownRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const lastWaitTimeRef = useRef(null);
  const socketRef = useRef(null);
  const previousWaitTimeRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Connected to socket server');
      if (restaurantId) {
        socket.emit('join-restaurant', restaurantId);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Connection error. Please try refreshing the page.');
    });

    socket.on('waitlist-update', (updatedWaitlist) => {
      console.log('📝 Received waitlist update:', updatedWaitlist);
      
      // Find the user's entry in the updated waitlist
      const userEntry = updatedWaitlist.find(entry => 
        entry.phone_number === waitlistEntry?.phoneNumber
      );

      if (!userEntry && waitlistEntry) {
        // Entry was removed
        setShowCancellationAnimation(true);
        setTimeout(() => {
          setShowCancellationAnimation(false);
          setWaitlistEntry(null);
          setRemainingSeconds(0);
        }, 3000);
      } else if (userEntry) {
        // Store the previous wait time before updating
        const previousWaitTime = waitlistEntry?.estimatedWaitTime || 0;
        previousWaitTimeRef.current = previousWaitTime;
        
        // Update the entry with new data
        const newWaitlistEntry = {
          ...userEntry,
          name: userEntry.customer_name,
          partySize: userEntry.party_size,
          phoneNumber: userEntry.phone_number,
          estimatedWaitTime: userEntry.estimated_wait_time
        };
        
        setWaitlistEntry(newWaitlistEntry);

        if (userEntry.estimated_wait_time) {
          // Calculate new wait time in seconds
          const newWaitTimeSeconds = userEntry.estimated_wait_time * 60;
          
          // Show animation if wait time changed
          if (previousWaitTime !== userEntry.estimated_wait_time) {
            const diff = userEntry.estimated_wait_time - previousWaitTime;
            console.log('⏱️ Wait time changed:', { 
              previous: previousWaitTime, 
              current: userEntry.estimated_wait_time, 
              diff 
            });
            
            // Update the time change animation
            setShowTimeChange({
              value: diff > 0 ? '+5 min' : '-5 min',
              type: diff > 0 ? 'increase' : 'decrease'
            });
            
            // Clear the animation after 1.5 seconds
            setTimeout(() => setShowTimeChange(null), 1500);
          }
          
          // Update the remaining seconds and refs
          setRemainingSeconds(newWaitTimeSeconds);
          lastWaitTimeRef.current = newWaitTimeSeconds;
          lastUpdateRef.current = Date.now();
        }
      }
    });

    socket.on('restaurant-update', (updatedRestaurant) => {
      console.log('🏪 Received restaurant update:', updatedRestaurant);
      setRestaurant(updatedRestaurant);
    });

    return () => {
      if (restaurantId) {
        socket.emit('leave-restaurant', restaurantId);
      }
      socket.disconnect();
    };
  }, [restaurantId]);

  useEffect(() => {
    if (remainingSeconds > 0) {
      countdownRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          const newValue = Math.max(0, prev - 1);
          if (newValue === 0) {
            setShowReadyAnimation(true);
            setTimeout(() => {
              setShowReadyAnimation(false);
            }, 5000);
          }
          return newValue;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [remainingSeconds]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = Math.floor(seconds % 60);
    return `${minutes}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) {
        setError('Restaurant ID is required');
        setLoading(false);
        return;
      }

      try {
        const [waitlistData, restaurantData] = await Promise.all([
          restaurantService.getWaitlist(restaurantId),
          restaurantService.getRestaurantInfo(restaurantId)
        ]);
        
        setRestaurant(restaurantData);
        
        // Check if user already has an entry
        const userEntry = waitlistData.find(entry => 
          entry.phone_number === waitlistEntry?.phoneNumber
        );
        
        if (userEntry) {
          setWaitlistEntry({
            ...userEntry,
            name: userEntry.customer_name,
            partySize: userEntry.party_size,
            phoneNumber: userEntry.phone_number,
            estimatedWaitTime: userEntry.estimated_wait_time
          });
          
          if (userEntry.estimated_wait_time) {
            setRemainingSeconds(userEntry.estimated_wait_time * 60);
            lastUpdateRef.current = Date.now();
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch waitlist data');
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!restaurantId) {
      setError('Restaurant ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const entry = {
        name: formData.get('name'),
        partySize: parseInt(formData.get('partySize')),
        phoneNumber: formData.get('phoneNumber'),
        notes: formData.get('notes')
      };

      const response = await restaurantService.joinWaitlist(restaurantId, entry);
      
      // Set the waitlist entry with the response data
      setWaitlistEntry({
        ...entry,
        id: response.id,
        status: response.status,
        estimatedWaitTime: response.estimated_wait_time
      });
      
      // Set the remaining seconds for the countdown timer
      if (response.estimated_wait_time) {
        setRemainingSeconds(response.estimated_wait_time * 60);
        lastUpdateRef.current = Date.now();
      }
    } catch (err) {
      setError('Failed to join waitlist');
      console.error('Error joining waitlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      const result = await restaurantService.removeFromWaitlist(waitlistEntry.id);
      if (result.success) {
        setWaitlistEntry(null);
        setError(null);
        // The socket event will handle updating the restaurant state
      } else {
        setError(result.error || 'Failed to cancel waitlist entry');
      }
    } catch (error) {
      console.error('Error canceling waitlist entry:', error);
      setError(error.message || 'Failed to cancel waitlist entry');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="waitlist-container loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waitlist-container error">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="waitlist-container">
      {showCancellationAnimation && (
        <div className="cancellation-animation">
          <div className="checkmark">✓</div>
          <p>Successfully removed from waitlist!</p>
        </div>
      )}

      {showReadyAnimation && (
        <div className="ready-animation">
          <div className="bell">🔔</div>
          <p>Your table is ready!</p>
        </div>
      )}

      {!waitlistEntry ? (
        <form onSubmit={handleJoinWaitlist} className="waitlist-form">
          <h2>Join the Waitlist</h2>
          {restaurant && (
            <div className="restaurant-info">
              <h3>{restaurant.name}</h3>
              <p>Current Wait Time: {restaurant.current_wait_time} minutes</p>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="partySize">Party Size</label>
            <input
              type="number"
              id="partySize"
              name="partySize"
              required
              min="1"
              placeholder="Number of people"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              required
              placeholder="Your phone number"
              autoComplete="tel"
            />
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Any special requests?"
              autoComplete="off"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join Waitlist'}
          </button>
        </form>
      ) : (
        <div className="waitlist-status">
          <h2>Your Waitlist Status</h2>
          <div className="status-details">
            <p><strong>Name:</strong> {waitlistEntry.name}</p>
            <p><strong>Party Size:</strong> {waitlistEntry.partySize}</p>
            <p><strong>Phone:</strong> {waitlistEntry.phoneNumber}</p>
            {waitlistEntry.notes && (
              <p><strong>Notes:</strong> {waitlistEntry.notes}</p>
            )}
            <div className="countdown-container">
              <p className="countdown-label">Estimated Wait Time</p>
              <div className="countdown-timer">{formatTime(remainingSeconds)}</div>
              {showTimeChange && (
                <div className={`wait-time-change ${showTimeChange.type}`}>
                  {showTimeChange.value}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={handleCancel}
            disabled={loading}
            className="cancel-button"
          >
            {loading ? 'Canceling...' : 'Cancel Waitlist Entry'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Waitlist; 