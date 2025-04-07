import { useState, useEffect } from 'react';
import { waitlistService } from '../services/api';
import { Link } from 'react-router-dom';
// We'll uncomment this when we implement authentication
// import { useAuth } from '../context/AuthContext';

export default function Waitlist() {
  const [joined, setJoined] = useState(false);
  const [waitTime] = useState(30); // In minutes
  const [timeLeft, setTimeLeft] = useState(waitTime * 60); // Convert to seconds
  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [waitlistId, setWaitlistId] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  
  // For demo purposes, we'll use a hardcoded restaurant ID
  // In a real app, this would come from a route parameter or context
  const RESTAURANT_ID = '123e4567-e89b-12d3-a456-426614174000';
  
  // We're not using isAuthenticated yet, but we'll keep the import for future use
  // const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (joined && waitlistId) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [joined, waitlistId]);

  const handleJoinWaitlist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate inputs
      if (!customerName.trim()) {
        setError('Please enter your name');
        return;
      }
      
      if (!phoneNumber.trim()) {
        setError('Please enter your phone number');
        return;
      }

      if (!consentGiven) {
        setError('Please consent to receive text messages');
        return;
      }
      
      // Add to waitlist
      const waitlistData = {
        customer_name: customerName,
        party_size: partySize,
        phone_number: phoneNumber,
        notes: notes.trim() || null,
        consent_given: consentGiven
      };
      
      const response = await waitlistService.addToWaitlist(RESTAURANT_ID, waitlistData);
      
      // Vibrate on mobile devices for tactile feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      setWaitlistId(response.id);
      setJoined(true);
    } catch (err) {
      setError(err.response?.data || 'Failed to join waitlist. Please try again.');
      console.error('Error joining waitlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="waitlist-container">
      <div className="waitlist-content">
        {!joined ? (
          <>
            <div className="restaurant-label">Welcome to</div>
            <h1 className="restaurant-name">Restaurant Name</h1>
            
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
                required
              />
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
                required
              />
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
              />
              <label htmlFor="consent">
                I consent to receive text messages about my waitlist status. 
                <Link to="/legal-terms" target="_blank"> View terms</Link>
              </label>
            </div>

            <button 
              className="join-button" 
              onClick={handleJoinWaitlist}
              disabled={loading || !consentGiven}
              aria-label="Join Waitlist"
            >
              {loading ? 'Joining...' : 'Join Waitlist'}
            </button>
          </>
        ) : (
          <div className="confirmation">
            <svg className="check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="confirmation-title">You're on the waitlist!</h2>
            
            <div className="timer-container" role="timer" aria-live="polite">
              <p className="timer-label">Estimated time until seated:</p>
              <div className="countdown">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
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
          </div>
        )}
      </div>
    </div>
  );
} 