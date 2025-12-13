import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import axios from '../config/axios';

const RestoreAccount = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/account/restore', { token });

      // Zapisz token JWT (auto-login)
      localStorage.setItem('token', response.data.token);

      setSuccess(true);

      // Przekieruj na dashboard po 2 sekundach
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Wystąpił błąd podczas przywracania konta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Konto przywrócone!
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Witamy z powrotem! Twoje konto zostało pomyślnie przywrócone.
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Przekierowujemy Cię do dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Przywróć swoje konto
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Kliknij poniżej, aby przywrócić swoje konto Garden App.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>ℹ️ Informacja:</strong> Przywracając konto odzyskasz dostęp do wszystkich swoich danych: poletek, grządek, zdjęć i notatek.
            </p>
          </div>

          <button
            onClick={handleRestore}
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Przywracanie...' : 'Przywróć moje konto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreAccount;
