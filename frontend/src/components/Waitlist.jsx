import { useState, useEffect } from 'react';
import { waitlistService, restaurantService } from '../services/api';
import { Link, useParams } from 'react-router-dom';
// We'll uncomment this when we implement authentication
// import { useAuth } from '../context/AuthContext';

export default function Waitlist() {
  const { restaurantId } = useParams();
  
  // If no restaurant ID is provided, use a default one
  const effectiveRestaurantId = restaurantId || '123e4567-e89b-12d3-a456-426614174000';
  
  // Debug the restaurant ID
  console.log('Current restaurant ID:', effectiveRestaurantId);
  
  // Initialize state from localStorage with a more robust approach
  const [joined, setJoined] = useState(() => {
    try {
      const savedState = localStorage.getItem('waitlistState');
      console.log('Saved state from localStorage:', savedState);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log('Parsed state:', parsedState);
        
        // Check if the saved state is for the current restaurant
        if (parsedState.restaurantId === effectiveRestaurantId) {
          console.log('Found matching restaurant ID in localStorage');
          return parsedState.joined || false;
        } else {
          console.log('Restaurant ID mismatch:', parsedState.restaurantId, 'vs', effectiveRestaurantId);
        }
      }
      return false;
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return false;
    }
  });
  
  const [waitTime, setWaitTime] = useState(0);
  
  const [remainingTime, setRemainingTime] = useState(() => {
    try {
      const savedState = localStorage.getItem('waitlistState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.restaurantId === effectiveRestaurantId) {
          return parsedState.remainingTime || 0;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return 0;
    }
  });
  
  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [waitlistId, setWaitlistId] = useState(() => {
    try {
      const savedState = localStorage.getItem('waitlistState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.restaurantId === effectiveRestaurantId) {
          return parsedState.waitlistId || null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return null;
    }
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [showLeaveSuccess, setShowLeaveSuccess] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  // We're not using isAuthenticated yet, but we'll keep the import for future use
  // const { isAuthenticated } = useAuth();

  // Phone number validation
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!customerName.trim()) {
      errors.customerName = 'Please enter your name';
    }
    
    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Please enter your phone number';
    } else if (!validatePhoneNumber(phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (!consentGiven) {
      errors.consent = 'Please consent to receive text messages';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save state to localStorage whenever relevant values change
  useEffect(() => {
    if (joined || waitlistId) {
      const stateToSave = {
        joined,
        waitlistId,
        remainingTime,
        restaurantId: effectiveRestaurantId
      };
      localStorage.setItem('waitlistState', JSON.stringify(stateToSave));
      console.log('Saved state to localStorage:', stateToSave);
    } else {
      localStorage.removeItem('waitlistState');
      console.log('Removed state from localStorage');
    }
  }, [joined, waitlistId, remainingTime, effectiveRestaurantId]);

  // Clear localStorage and state when timer reaches 0
  useEffect(() => {
    if (remainingTime <= 0 && joined) {
      console.log('Timer reached 0, clearing state');
      localStorage.removeItem('waitlistState');
      setJoined(false);
      setWaitlistId(null);
    }
  }, [remainingTime, joined]);

  // Fetch restaurant details and update wait time every 5 minutes
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        setRestaurantLoading(true);
        console.log('Fetching restaurant details for:', effectiveRestaurantId);
        const response = await restaurantService.getRestaurant(effectiveRestaurantId);
        console.log('Restaurant details:', response);
        setRestaurantName(response.name);
        setWaitTime(response.current_wait_time);
        
        // Only update remaining time if we're not already on the waitlist
        // or if we're fetching for the first time
        if (!joined || remainingTime === 0) {
          console.log('Setting initial remaining time:', response.current_wait_time * 60);
          setRemainingTime(response.current_wait_time * 60); // Convert minutes to seconds
        }
        
        setRestaurantLoading(false);
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        setRestaurantName('Restaurant Name');
        setRestaurantLoading(false);
        setError('Failed to load restaurant details. Please try again later.');
      }
    };

    fetchRestaurantDetails();
    // Update restaurant details every 5 minutes
    const updateInterval = setInterval(fetchRestaurantDetails, 5 * 60 * 1000);
    return () => clearInterval(updateInterval);
  }, [effectiveRestaurantId]);

  // Countdown timer effect
  useEffect(() => {
    if (!joined || remainingTime <= 0) return;

    console.log('Starting countdown timer with remaining time:', remainingTime);
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          console.log('Timer reached 0');
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [joined, remainingTime]);

  // Format remaining time
  const formatRemainingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleJoinWaitlist = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setError(null);
      
      const waitlistData = {
        customer_name: customerName,
        party_size: partySize,
        phone_number: phoneNumber,
        notes: notes.trim() || null,
        consent_given: consentGiven
      };
      
      console.log(`Adding to waitlist for restaurant: ${effectiveRestaurantId}`);
      const response = await waitlistService.addToWaitlist(effectiveRestaurantId, waitlistData);
      
      // Vibrate on mobile devices for tactile feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      setWaitlistId(response.id);
      setShowJoinSuccess(true);
      
      // Set the remaining time based on the current wait time
      // Convert minutes to seconds and ensure it's at least 1 minute
      const initialWaitTime = Math.max(60, waitTime * 60);
      console.log('Setting initial wait time to:', initialWaitTime, 'seconds');
      setRemainingTime(initialWaitTime);
      
      // Show success animation for 1.5 seconds before showing the confirmation screen
      setTimeout(() => {
        setShowJoinSuccess(false);
        setJoined(true);
        console.log('Joined waitlist successfully, setting joined to true');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join waitlist. Please try again.');
      console.error('Error joining waitlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!waitlistId) return;
    
    if (!window.confirm('Are you sure you want to leave the waitlist?')) {
      return;
    }
    
    try {
      setIsLeaving(true);
      setError('');
      
      // Call the API to remove from waitlist
      await waitlistService.removeFromWaitlist(waitlistId);
      
      // Clear local storage
      localStorage.removeItem('waitlistState');
      
      // Reset state
      setJoined(false);
      setWaitlistId(null);
      setRemainingTime(0);
      
      // Show success message
      setShowLeaveSuccess(true);
      setTimeout(() => {
        setShowLeaveSuccess(false);
      }, 1500);
      
    } catch (err) {
      setError('Failed to leave waitlist. Please try again.');
      console.error('Error leaving waitlist:', err);
    } finally {
      setIsLeaving(false);
    }
  };

  // Debug logging to help identify issues
  useEffect(() => {
    console.log('Current state:', {
      joined,
      waitlistId,
      remainingTime,
      showJoinSuccess,
      showLeaveSuccess,
      restaurantId: effectiveRestaurantId
    });
  }, [joined, waitlistId, remainingTime, showJoinSuccess, showLeaveSuccess, effectiveRestaurantId]);

  // Force a re-render if we're on the waitlist but not showing the confirmation screen
  useEffect(() => {
    if (joined && !showJoinSuccess && !showLeaveSuccess) {
      console.log('Forcing re-render of confirmation screen');
      // This is just to trigger a re-render
      setJoined(prev => prev);
    }
  }, [joined, showJoinSuccess, showLeaveSuccess]);

  return (
    <div className="waitlist-container">
      <div className="waitlist-content">
        {showJoinSuccess ? (
          <div className="success-animation">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h2>Added to Waitlist!</h2>
          </div>
        ) : showLeaveSuccess ? (
          <div className="success-animation">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h2>Left Waitlist Successfully!</h2>
          </div>
        ) : !joined ? (
          <>
            <div className="restaurant-label">Welcome to</div>
            <h1 className="restaurant-name">
              {restaurantLoading ? 'Loading...' : restaurantName}
            </h1>
            
            <div className="wait-time">
              <svg className="clock-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Estimated wait time: {waitTime} minutes</span>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="customerName">Your Name</label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className={formErrors.customerName ? 'error' : ''}
                required
              />
              {formErrors.customerName && (
                <span className="error-text">{formErrors.customerName}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="partySize">Party Size</label>
              <select
                id="partySize"
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className={formErrors.phoneNumber ? 'error' : ''}
                required
              />
              {formErrors.phoneNumber && (
                <span className="error-text">{formErrors.phoneNumber}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Special Requests (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes?"
                rows="3"
              />
            </div>

            <div className="consent-container">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className={formErrors.consent ? 'error' : ''}
              />
              <label htmlFor="consent">
                I consent to receive text messages about my waitlist status. 
                <Link to="/legal-terms" target="_blank"> View terms</Link>
              </label>
              {formErrors.consent && (
                <span className="error-text">{formErrors.consent}</span>
              )}
            </div>

            <button 
              className={`join-button ${loading ? 'loading' : ''}`}
              onClick={handleJoinWaitlist}
              disabled={loading}
              aria-label="Join Waitlist"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Joining...
                </>
              ) : (
                'Join Waitlist'
              )}
            </button>
          </>
        ) : (
          <div className="confirmation">
            <svg className="check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="confirmation-title">You're on the waitlist!</h2>
            
            <div className="wait-time-display">
              <p className="wait-time-label">Time remaining:</p>
              <div className="wait-time-value">{formatRemainingTime(remainingTime)}</div>
            </div>

            <div className="notification-box">
              <p>
                We'll send you a notification when your table is ready.
                Feel free to explore the area while you wait!
              </p>
            </div>
            
            {waitlistId && (
              <div className="waitlist-id">
                <p>Your waitlist ID: {waitlistId}</p>
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              className="leave-button"
              onClick={handleLeaveWaitlist}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <>
                  <span className="spinner"></span>
                  Leaving...
                </>
              ) : (
                'Leave Waitlist'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 