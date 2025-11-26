import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

/**
 * CookieConsent - Banner informujący o ciasteczkach
 *
 * Zgodnie z RODO/ePrivacy wymaga zgody użytkownika na przechowywanie cookies
 * Zgoda jest zapisywana w localStorage
 */
const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Sprawdź czy użytkownik już wyraził zgodę
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Pokaż banner po 1 sekundzie (żeby nie był natarczywy)
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    // Przekieruj na stronę główną - użytkownik nie może korzystać z app bez cookies
    window.location.href = '/';
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Ciasteczka i prywatność
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Używamy ciasteczek (cookies) do zarządzania sesją logowania i zapewnienia podstawowej funkcjonalności aplikacji.
              Przechowujemy także Twoją lokalizację w celu wyświetlania pogody oraz dane o Twoim ogrodzie.
            </p>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 text-sm">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                Jakie dane zbieramy:
              </p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Token uwierzytelniający (do logowania)</li>
                <li>• Lokalizacja (dla prognozy pogody)</li>
                <li>• Dane o Twoich działkach i roślinach</li>
                <li>• Data ostatniego logowania</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Bez akceptacji ciasteczek nie możesz korzystać z aplikacji.
              Szczegółowe informacje znajdziesz w{' '}
              <Link
                to="/privacy-policy"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Polityce Prywatności
              </Link>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                Akceptuję
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors"
              >
                Odrzuć
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
