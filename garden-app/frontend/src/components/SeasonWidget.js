import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Thermometer, Snowflake, Sun, AlertTriangle, Leaf, Calendar } from 'lucide-react';
import axios from '../config/axios';

const SeasonWidget = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  // If no frost dates set, show prompt to set them
  if (!profile?.last_frost_date && !profile?.first_frost_date) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Thermometer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-1">
              Ustaw swoją strefę klimatyczną
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              Dodaj informacje o strefie mrozoodporności, aby otrzymywać spersonalizowane porady sezonowe i alerty o przymrozkach.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              <Thermometer size={16} />
              Ustaw strefę
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const currentYear = today.getFullYear();

  // Parse frost dates (they might be stored as MM-DD or YYYY-MM-DD)
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    // If it's just MM-DD, add current year
    if (dateStr.length === 5) {
      return new Date(`${currentYear}-${dateStr}`);
    }
    return new Date(dateStr);
  };

  const lastFrostDate = parseDate(profile.last_frost_date);
  const firstFrostDate = parseDate(profile.first_frost_date);

  // Adjust dates to current year's context
  let adjustedLastFrost = lastFrostDate;
  let adjustedFirstFrost = firstFrostDate;

  if (lastFrostDate) {
    adjustedLastFrost = new Date(currentYear, lastFrostDate.getMonth(), lastFrostDate.getDate());
  }
  if (firstFrostDate) {
    adjustedFirstFrost = new Date(currentYear, firstFrostDate.getMonth(), firstFrostDate.getDate());
  }

  // Calculate days
  const daysUntilLastFrost = adjustedLastFrost ? Math.ceil((adjustedLastFrost - today) / (1000 * 60 * 60 * 24)) : null;
  const daysUntilFirstFrost = adjustedFirstFrost ? Math.ceil((adjustedFirstFrost - today) / (1000 * 60 * 60 * 24)) : null;

  // Determine current season phase
  const getSeasonPhase = () => {
    if (!adjustedLastFrost || !adjustedFirstFrost) return 'unknown';

    // Before last spring frost
    if (today < adjustedLastFrost) {
      return 'pre-season';
    }
    // After first fall frost
    if (today > adjustedFirstFrost) {
      return 'post-season';
    }
    // Growing season
    return 'growing';
  };

  const phase = getSeasonPhase();

  // Render based on phase
  const renderContent = () => {
    switch (phase) {
      case 'pre-season':
        return (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl shadow-sm p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Snowflake className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                    Oczekiwanie na sezon
                  </h3>
                  {profile.hardiness_zone && (
                    <span className="px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                      Strefa {profile.hardiness_zone}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {daysUntilLastFrost}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    dni do końca<br/>przymrozków
                  </div>
                </div>

                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Bezpieczne sadzenie roślin ciepłolubnych od <strong>{adjustedLastFrost?.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}</strong>
                </p>

                {daysUntilLastFrost <= 30 && (
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
                      <AlertTriangle size={16} />
                      <span>Przygotuj rozsady! "Zimni ogrodnicy" (12-15 maja) zbliżają się.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'growing':
        const growingDays = Math.ceil((today - adjustedLastFrost) / (1000 * 60 * 60 * 24));
        const totalSeason = Math.ceil((adjustedFirstFrost - adjustedLastFrost) / (1000 * 60 * 60 * 24));
        const progress = Math.min(100, Math.round((growingDays / totalSeason) * 100));

        return (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Sun className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-900 dark:text-green-200">
                    Sezon wegetacyjny
                  </h3>
                  {profile.hardiness_zone && (
                    <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                      Strefa {profile.hardiness_zone}
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm text-green-700 dark:text-green-300 mb-1">
                    <span>Dzień {growingDays} z {totalSeason}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {daysUntilFirstFrost}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    dni do pierwszego<br/>przymrozku jesiennego
                  </div>
                </div>

                {daysUntilFirstFrost <= 30 && daysUntilFirstFrost > 0 && (
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 text-sm">
                      <AlertTriangle size={16} />
                      <span>Przygotuj się do wykopania dalii, mieczyków i begonii!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'post-season':
        return (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl shadow-sm p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Leaf className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                    Sezon zakończony
                  </h3>
                  {profile.hardiness_zone && (
                    <span className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                      Strefa {profile.hardiness_zone}
                    </span>
                  )}
                </div>

                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  Okres przymrozków rozpoczął się. Czas na zimowe przygotowania.
                </p>

                <div className="space-y-2">
                  <Link
                    to="/winter-protection"
                    className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition text-amber-800 dark:text-amber-200 text-sm"
                  >
                    <Snowflake size={16} />
                    Sprawdź rośliny do zabezpieczenia
                  </Link>
                  <Link
                    to="/planner"
                    className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/60 transition text-amber-800 dark:text-amber-200 text-sm"
                  >
                    <Calendar size={16} />
                    Zaplanuj działania na przyszły sezon
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
};

export default SeasonWidget;
