import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-green-600">🌱 Garden App</span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-green-600"
                >
                  Dashboard
                </Link>
                <Link
                  to="/plots"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-green-600"
                >
                  Poletka
                </Link>
                <Link
                  to="/sprays"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-green-600"
                >
                  Historia oprysków
                </Link>
                <Link
                  to="/reminders"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-green-600"
                >
                  Przypomnienia
                </Link>
                <Link
                  to="/export"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-green-600"
                >
                  Eksport
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
