import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Snowflake, Sun, Leaf, Thermometer } from 'lucide-react';
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
    return null; // Don't show anything while loading
  }

  // If no frost dates set, show subtle prompt
  if (!profile?.last_frost_date && !profile?.first_frost_date) {
    return (
      <Link
        to="/profile"
        className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
      >
        <Thermometer className="w-5 h-5 text-purple-500" />
        <span className="text-sm text-purple-700 dark:text-purple-300">
          Ustaw strefę klimatyczną w profilu
        </span>
      </Link>
    );
  }

  const today = new Date();
  const currentYear = today.getFullYear();

  // Parse frost dates
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.length === 5) {
      return new Date(`${currentYear}-${dateStr}`);
    }
    return new Date(dateStr);
  };

  const lastFrostDate = parseDate(profile.last_frost_date);
  const firstFrostDate = parseDate(profile.first_frost_date);

  let adjustedLastFrost = lastFrostDate;
  let adjustedFirstFrost = firstFrostDate;

  if (lastFrostDate) {
    adjustedLastFrost = new Date(currentYear, lastFrostDate.getMonth(), lastFrostDate.getDate());
  }
  if (firstFrostDate) {
    adjustedFirstFrost = new Date(currentYear, firstFrostDate.getMonth(), firstFrostDate.getDate());
  }

  const daysUntilLastFrost = adjustedLastFrost ? Math.ceil((adjustedLastFrost - today) / (1000 * 60 * 60 * 24)) : null;
  const daysUntilFirstFrost = adjustedFirstFrost ? Math.ceil((adjustedFirstFrost - today) / (1000 * 60 * 60 * 24)) : null;

  // Determine current season phase
  const getSeasonPhase = () => {
    if (!adjustedLastFrost || !adjustedFirstFrost) return 'unknown';
    if (today < adjustedLastFrost) return 'pre-season';
    if (today > adjustedFirstFrost) return 'post-season';
    return 'growing';
  };

  const phase = getSeasonPhase();

  // Compact inline widget
  const renderContent = () => {
    switch (phase) {
      case 'pre-season':
        return (
          <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {daysUntilLastFrost} dni do sezonu
              </span>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Sadzenie od {adjustedLastFrost?.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            </span>
            {profile.hardiness_zone && (
              <span className="ml-auto px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs rounded">
                {profile.hardiness_zone}
              </span>
            )}
          </div>
        );

      case 'growing':
        const growingDays = Math.ceil((today - adjustedLastFrost) / (1000 * 60 * 60 * 24));
        const totalSeason = Math.ceil((adjustedFirstFrost - adjustedLastFrost) / (1000 * 60 * 60 * 24));
        const progress = Math.min(100, Math.round((growingDays / totalSeason) * 100));

        return (
          <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Sezon: dzień {growingDays}
              </span>
            </div>
            <div className="flex-1 max-w-24">
              <div className="h-1.5 bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-orange-600 dark:text-orange-400">
              {daysUntilFirstFrost} dni do jesieni
            </span>
            {profile.hardiness_zone && (
              <span className="px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-200 text-xs rounded">
                {profile.hardiness_zone}
              </span>
            )}
          </div>
        );

      case 'post-season':
        return (
          <div className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Sezon zakończony
              </span>
            </div>
            <Link
              to="/winter-protection"
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              Ochrona zimowa →
            </Link>
            {profile.hardiness_zone && (
              <span className="ml-auto px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200 text-xs rounded">
                {profile.hardiness_zone}
              </span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
};

export default SeasonWidget;
