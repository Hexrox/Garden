import React, { useState } from 'react';
import { Mail, X, RefreshCw } from 'lucide-react';
import axios from '../config/axios';

const EmailVerificationBanner = ({ user }) => {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('emailBannerDismissed') === 'true'
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post('/api/auth/resend-verification');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error resending verification:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('emailBannerDismissed', 'true');
    setDismissed(true);
  };

  if (dismissed || user?.email_verified) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </span>
            <p className="ml-3 font-medium text-yellow-800 dark:text-yellow-200 text-sm">
              {success ? (
                'Email weryfikacyjny wysłany! Sprawdź swoją skrzynkę.'
              ) : (
                <>
                  <span className="md:hidden">Potwierdź swój email</span>
                  <span className="hidden md:inline">
                    Potwierdź swój adres email, aby w pełni korzystać z Garden App
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <button
              onClick={handleResend}
              disabled={loading || success}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>Wyślij ponownie</>
              )}
            </button>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              onClick={handleDismiss}
              className="-mr-1 flex p-2 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
            >
              <X className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
