import React from 'react';

export default function LegalTerms() {
  return (
    <div className="legal-terms-container">
      <div className="legal-terms-content">
        <h1>Text Message Consent and Legal Terms</h1>
        
        <section className="legal-section">
          <h2>Consent to Receive Text Messages</h2>
          <p>
            By joining our waitlist, you consent to receive automated text messages from our restaurant
            regarding your waitlist status, table availability, and other relevant updates.
          </p>
        </section>

        <section className="legal-section">
          <h2>Message Frequency</h2>
          <p>
            You will receive text messages only when:
          </p>
          <ul>
            <li>Your table is ready</li>
            <li>There are significant changes to your wait time</li>
            <li>We need to confirm your presence</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Message and Data Rates</h2>
          <p>
            Message and data rates may apply. You are responsible for any charges from your mobile carrier.
            Please contact your carrier for pricing details.
          </p>
        </section>

        <section className="legal-section">
          <h2>Opt-Out Instructions</h2>
          <p>
            To stop receiving text messages, reply STOP to any message you receive. You will be removed
            from our messaging list and will no longer receive updates about your waitlist status.
          </p>
        </section>

        <section className="legal-section">
          <h2>Privacy Policy</h2>
          <p>
            Your phone number will be used solely for waitlist-related communications and will not be
            shared with third parties. We use Twilio as our messaging service provider.
          </p>
        </section>

        <section className="legal-section">
          <h2>Support</h2>
          <p>
            For assistance with text messages, contact our restaurant directly or reply HELP to any
            message you receive.
          </p>
        </section>
      </div>
    </div>
  );
} 