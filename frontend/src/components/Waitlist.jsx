import { useState, useEffect } from 'react';

export default function Waitlist() {
  const [joined, setJoined] = useState(false);
  const ESTIMATED_TIME = 30; // In minutes - using constant since it won't change
  const [timeLeft, setTimeLeft] = useState(ESTIMATED_TIME * 60); // Convert to seconds

  useEffect(() => {
    if (joined) {
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
  }, [joined]);

  const handleJoinWaitlist = () => {
    // Vibrate on mobile devices for tactile feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    setJoined(true);
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
              <span>Estimated wait time: {ESTIMATED_TIME} minutes</span>
            </div>

            <button 
              className="join-button" 
              onClick={handleJoinWaitlist}
              aria-label="Join Waitlist"
            >
              Join Waitlist
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
          </div>
        )}
      </div>
    </div>
  );
} 