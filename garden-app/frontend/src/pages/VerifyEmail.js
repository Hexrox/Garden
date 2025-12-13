import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from '../config/axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/api/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message);
        setUsername(response.data.username);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Wystąpił błąd podczas weryfikacji');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 mb-4">
                  <Loader className="h-8 w-8 text-green-600 dark:text-green-400 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Weryfikujemy Twój email...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Proszę czekać
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Email zweryfikowany!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Witaj {username}! Twój email został pomyślnie potwierdzony.
                </p>
                <Link
                  to="/login"
                  className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Zaloguj się
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Weryfikacja nie powiodła się
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {message}
                </p>
                <Link
                  to="/login"
                  className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Przejdź do logowania
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
