import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Droplets, Bell, Calendar, Snowflake, Sun, Leaf, Thermometer } from 'lucide-react';
import axios from '../config/axios';
import { useAuth } from '../context/AuthContext';
import WeatherWidget from '../components/WeatherWidget';
import TaskList from '../components/TaskList';
import SuccessionWidget from '../components/SuccessionWidget';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import WelcomeCard from '../components/onboarding/WelcomeCard';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPlots: 0,
    totalBeds: 0,
    activeSprays: 0
  });
  const [reminders, setReminders] = useState([]);
  const [activeSprays, setActiveSprays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Season info for hero header
  const [seasonInfo, setSeasonInfo] = useState(null);

  // Onboarding states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    loadDashboardData();
    checkOnboardingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check both onboarding status AND if user has any data
      const [profileRes, plotsRes] = await Promise.all([
        axios.get('/api/auth/profile'),
        axios.get('/api/plots')
      ]);

      const completed = profileRes.data.onboarding_completed === 1;
      const hasData = plotsRes.data.length > 0;
      setOnboardingCompleted(completed);

      // Calculate season info for hero header
      const profile = profileRes.data;
      calculateSeasonInfo(profile);

      // Auto-geocode city if user has city but no coordinates
      if (profile.city && (!profile.latitude || !profile.longitude)) {
        try {
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profile.city)}&limit=1`
          );
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData && geocodeData.length > 0) {
              const { lat, lon } = geocodeData[0];
              await axios.put('/api/auth/update-profile', {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon)
              });
            }
          }
        } catch {
          // Ignore geocoding errors silently
        }
      }

      const welcomeDismissed = profileRes.data.welcome_card_dismissed === 1;

      if (!completed && !hasData) {
        // New user without data - show onboarding
        setShowOnboarding(true);
      } else if (!completed && hasData) {
        // User has data but onboarding not marked complete
        // Auto-complete it (user already knows the app)
        try {
          await axios.put('/api/auth/complete-onboarding');
          setOnboardingCompleted(true);
        } catch {
          // Ignore error silently
        }
        setShowWelcomeCard(!welcomeDismissed);
      } else {
        // Onboarding completed - show welcome card if not dismissed
        setShowWelcomeCard(!welcomeDismissed);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await axios.put('/api/auth/complete-onboarding');
      setShowOnboarding(false);
      setOnboardingCompleted(true);
      setShowWelcomeCard(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still hide wizard even on error
      setShowOnboarding(false);
      setShowWelcomeCard(true);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      // CRITICAL: Mark onboarding as completed in database
      // Without this, onboarding will show again on next login
      await axios.put('/api/auth/complete-onboarding');
      setOnboardingCompleted(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still close wizard even on error
    }
    setShowOnboarding(false);
    setShowWelcomeCard(true);
  };

  const handleWelcomeCardDismiss = async () => {
    setShowWelcomeCard(false);
    try {
      await axios.put('/api/auth/dismiss-welcome');
    } catch {
      // Ignore
    }
  };

  const handleShowTour = () => {
    setShowWelcomeCard(false);
    setShowOnboarding(true);
  };

  const loadDashboardData = async () => {
    try {
      // Add individual .catch() handlers to prevent total failure
      const [plotsRes, remindersRes, spraysRes] = await Promise.all([
        axios.get('/api/plots').catch(err => {
          console.error('Error loading plots:', err);
          return { data: [] };
        }),
        axios.get('/api/reminders').catch(err => {
          console.error('Error loading reminders:', err);
          return { data: [] };
        }),
        axios.get('/api/sprays/active').catch(err => {
          console.error('Error loading sprays:', err);
          return { data: [] };
        })
      ]);

      setStats({
        totalPlots: plotsRes.data.length,
        activeSprays: spraysRes.data.length
      });

      setReminders(remindersRes.data.slice(0, 5));
      setActiveSprays(spraysRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Even on error, set empty data rather than hanging
      setStats({ totalPlots: 0, totalBeds: 0, activeSprays: 0 });
      setReminders([]);
      setActiveSprays([]);
    } finally {
      setLoading(false);
    }
  };

  const markReminderAsRead = async (id) => {
    try {
      await axios.put(`/api/reminders/${id}/read`);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error marking reminder:', error);
    }
  };

  // Calculate season info from profile frost dates
  const calculateSeasonInfo = (profile) => {
    if (!profile?.last_frost_date && !profile?.first_frost_date) {
      setSeasonInfo({ type: 'no-data' });
      return;
    }

    const today = new Date();
    const currentYear = today.getFullYear();

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

    // Determine phase
    if (!adjustedLastFrost || !adjustedFirstFrost) {
      setSeasonInfo({ type: 'unknown' });
      return;
    }

    if (today < adjustedLastFrost) {
      // Pre-season
      setSeasonInfo({
        type: 'pre-season',
        daysUntil: daysUntilLastFrost,
        plantingDate: adjustedLastFrost.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
        zone: profile.hardiness_zone
      });
    } else if (today > adjustedFirstFrost) {
      // Post-season
      setSeasonInfo({
        type: 'post-season',
        zone: profile.hardiness_zone
      });
    } else {
      // Growing season
      const growingDays = Math.ceil((today - adjustedLastFrost) / (1000 * 60 * 60 * 24));
      const totalSeason = Math.ceil((adjustedFirstFrost - adjustedLastFrost) / (1000 * 60 * 60 * 24));
      const progress = Math.min(100, Math.round((growingDays / totalSeason) * 100));
      setSeasonInfo({
        type: 'growing',
        day: growingDays,
        progress,
        daysUntilFrost: daysUntilFirstFrost,
        zone: profile.hardiness_zone
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 animate-pulse">
        {/* Hero skeleton */}
        <div className="h-40 bg-gradient-to-br from-green-200 to-emerald-100 dark:from-green-900/50 dark:to-emerald-800/30 rounded-2xl"></div>

        {/* Widgets skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <EmailVerificationBanner user={user} />
      <div className="space-y-4 md:space-y-6">
        {/* Onboarding Wizard */}
        {showOnboarding && (
          <OnboardingWizard
            isOpen={showOnboarding}
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}

      {/* Hero Header with Gradient + Season Info */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 dark:from-green-800 dark:via-green-700 dark:to-emerald-600 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

        <div className="relative flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-green-100 text-sm font-medium">
                {new Date().getHours() < 12 ? 'Dzień dobry' : new Date().getHours() < 18 ? 'Cześć' : 'Dobry wieczór'},
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white truncate">
                {user?.username}!
              </h1>
            </div>
            {/* Season info integrated into hero */}
            {seasonInfo && seasonInfo.type === 'pre-season' && (
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 sm:mt-3 text-green-100">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Snowflake size={14} className="text-blue-200 flex-shrink-0" />
                  {seasonInfo.daysUntil} dni do sezonu
                </span>
                <span className="text-xs opacity-80">• Sadzenie od {seasonInfo.plantingDate}</span>
                {seasonInfo.zone && (
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs">{seasonInfo.zone}</span>
                )}
              </div>
            )}
            {seasonInfo && seasonInfo.type === 'growing' && (
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 sm:mt-3 text-green-100">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Sun size={14} className="text-yellow-200 flex-shrink-0" />
                  Sezon: dzień {seasonInfo.day}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full" style={{ width: `${seasonInfo.progress}%` }} />
                  </div>
                  <span className="text-xs opacity-80">{seasonInfo.daysUntilFrost} dni do jesieni</span>
                </div>
                {seasonInfo.zone && (
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs">{seasonInfo.zone}</span>
                )}
              </div>
            )}
            {seasonInfo && seasonInfo.type === 'post-season' && (
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 sm:mt-3 text-green-100">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Leaf size={14} className="text-amber-200 flex-shrink-0" />
                  Sezon zakończony
                </span>
                <Link to="/winter-protection" className="text-xs underline opacity-80 hover:opacity-100">
                  Ochrona zimowa →
                </Link>
              </div>
            )}
            {seasonInfo && seasonInfo.type === 'no-data' && (
              <Link
                to="/profile"
                className="flex items-center gap-2 mt-2 sm:mt-3 text-green-100 hover:text-white transition-colors"
              >
                <Thermometer size={14} />
                <span className="text-xs">Ustaw strefę klimatyczną w profilu →</span>
              </Link>
            )}
          </div>
          <Link
            to="/calendar"
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl shadow-lg transition-all duration-200 font-medium border border-white/20"
          >
            <Calendar size={18} />
            <span className="hidden sm:inline">Kalendarz</span>
          </Link>
        </div>
      </div>

      {/* Welcome Card */}
      {showWelcomeCard && onboardingCompleted && (
        <WelcomeCard
          onDismiss={handleWelcomeCardDismiss}
          onShowTour={handleShowTour}
        />
      )}

      {/* Widgets Row - Weather, Tasks (with Harvests & Plans integrated) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <WeatherWidget />
        <TaskList />
      </div>

      {/* Succession Planting Widget */}
      <SuccessionWidget />

      {/* CTA for new users without plots */}
      {stats.totalPlots === 0 && !showOnboarding && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-green-100 dark:border-green-900 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nie masz jeszcze żadnej działki</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Utwórz działkę i zacznij planować swój ogródek</p>
          <Link
            to="/plots/new"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Dodaj pierwszą działkę
          </Link>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Link to="/plots" className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-transparent hover:border-green-200 dark:hover:border-green-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sprout className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Poletka</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPlots}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600 dark:text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Zobacz wszystkie
            <span className="ml-1 group-hover:ml-2 transition-all">→</span>
          </div>
        </Link>

        <Link to="/sprays" className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Droplets className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktywne opryski</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeSprays}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Zobacz historię
            <span className="ml-1 group-hover:ml-2 transition-all">→</span>
          </div>
        </Link>

        <Link to="/reminders" className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-transparent hover:border-amber-200 dark:hover:border-amber-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Bell className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Przypomnienia</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{reminders.length}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Zobacz wszystkie
            <span className="ml-1 group-hover:ml-2 transition-all">→</span>
          </div>
        </Link>
      </div>

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aktywne przypomnienia</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reminder.message}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {reminder.plot_name} - Rząd {reminder.row_number} ({reminder.plant_name})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Data przypomnienia: {reminder.reminder_date}
                    </p>
                  </div>
                  <button
                    onClick={() => markReminderAsRead(reminder.id)}
                    className="ml-4 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    Oznacz jako przeczytane
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Sprays Section */}
      {activeSprays.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aktywne opryski (w okresie karencji)</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeSprays.map((spray) => (
              <div key={spray.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{spray.spray_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {spray.plot_name} - Rząd {spray.row_number} ({spray.plant_name})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Data oprysku: {spray.spray_date} | Bezpieczny zbiór: {spray.safe_harvest_date}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                    Karencja: {spray.withdrawal_period} dni
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Footer with Privacy Policy link */}
      <div className="mt-8 text-center pb-4">
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          📄 Polityka prywatności
        </a>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
