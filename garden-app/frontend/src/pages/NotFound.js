import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white mb-4">
            <span className="text-6xl">🌱</span>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Strona nie znaleziona
          </h2>
        </div>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Ups! Ta strona nie istnieje. Może szukasz którejś z poniższych?
        </p>

        {/* Quick Links */}
        <div className="space-y-3 mb-8">
          <Link
            to="/dashboard"
            className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            🏠 Dashboard
          </Link>
          <Link
            to="/plots"
            className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
          >
            🌿 Moje działki
          </Link>
          <Link
            to="/calendar"
            className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
          >
            📅 Kalendarz
          </Link>
        </div>

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
        >
          ← Wróć do poprzedniej strony
        </button>
      </div>
    </div>
  );
};

export default NotFound;
