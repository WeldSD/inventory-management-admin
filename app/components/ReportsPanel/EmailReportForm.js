'use client';
import { useState, useRef } from 'react';

export default function EmailReportForm({ reportPeriod, reportData }) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const emailRef = useRef(null);
  
  // Handle sending report via email
  const handleSendEmail = (e) => {
    e.preventDefault();
    const email = emailRef.current.value;
    if (!email) return;
    
    setSendingEmail(true);
    
    // Here you would integrate with your email service provider
    // For example using SendGrid, EmailJS, or even a custom API endpoint
    
    // Sample implementation (replace with actual implementation)
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSent(true);
      
      // Reset email sent notification after 5 seconds
      setTimeout(() => {
        setEmailSent(false);
      }, 5000);
    }, 1500);
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Send Report via Email</h3>
      <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row gap-3">
        <input
          ref={emailRef}
          type="email"
          placeholder="Enter email address"
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 flex-grow"
          required
        />
        <button
          type="submit"
          disabled={sendingEmail || emailSent}
          className={`px-4 py-2 rounded-md text-white font-medium 
            ${emailSent 
              ? 'bg-green-500 hover:bg-green-600' 
              : sendingEmail 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-600'}`}
        >
          {emailSent ? 'Email Sent!' : sendingEmail ? 'Sending...' : 'Send Report'}
        </button>
      </form>
    </div>
  );
}