import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Droplets, Bell, Plus, BarChart3, Save, Calendar } from 'lucide-react';
import axios from '../config/axios';
import { useAuth } from '../context/AuthContext';
import WeatherWidget from '../components/WeatherWidget';
import TaskList from '../components/TaskList';
import UpcomingHarvests from '../components/UpcomingHarvests';
import UpcomingPlans from '../components/UpcomingPlans';
import SuccessionWidget from '../components/SuccessionWidget';
import BloomCalendar from '../components/BloomCalendar';
import SeasonWidget from '../components/SeasonWidget';
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

      // Auto-geocode city if user has city but no coordinates
      const profile = profileRes.data;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Ładowanie...</div>
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

      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 dark:from-green-800 dark:via-green-700 dark:to-emerald-600 rounded-2xl p-6 md:p-8 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-green-100 text-sm font-medium mb-1">
              {new Date().getHours() < 12 ? 'Dzień dobry' : new Date().getHours() < 18 ? 'Cześć' : 'Dobry wieczór'},
            </p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
              {user?.username}!
            </h1>
            <p className="text-green-100 mt-2 text-sm md:text-base">
              Przegląd Twojego ogrodu na dziś
            </p>
          </div>
          <Link
            to="/calendar"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl shadow-lg transition-all duration-200 font-medium border border-white/20"
          >
            <Calendar size={20} />
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

      {/* Season Widget - Frost countdown and seasonal info */}
      <SeasonWidget />

      {/* Widgets Row - Weather, Tasks, Harvests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <WeatherWidget />
        <TaskList />
        <UpcomingHarvests />
      </div>

      {/* Upcoming Plans Widget */}
      <UpcomingPlans />

      {/* Bloom Calendar - Horizontal Layout */}
      <BloomCalendar horizontal />

      {/* Succession Planting Widget */}
      <SuccessionWidget />

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
              <div key={reminder.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
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
              <div key={spray.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
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

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Szybkie akcje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/plots/new"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Plus size={18} />
            Nowe poletko
          </Link>
          <Link
            to="/sprays"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <BarChart3 size={18} />
            Historia oprysków
          </Link>
          <Link
            to="/export"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Save size={18} />
            Eksport danych
          </Link>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>❓</span> Często zadawane pytania
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <FAQItem
            question="Od czego zacząć?"
            answer="Rozpocznij od stworzenia swojego pierwszego poletka (ogród, balkon, działka). Następnie dodaj grządki z roślinami, które chcesz uprawiać. Aplikacja automatycznie obliczy daty zbiorów i zasugeruje najlepsze momenty na prace ogrodnicze!"
          />
          <FAQItem
            question="Czym różni się poletko od grządki?"
            answer="Poletko to fizyczna lokalizacja (np. 'Ogród za domem', 'Balkon od południa'). Grządka to konkretna roślina lub grupa roślin na tym poletku (np. Rząd 1: Pomidory, Rząd 2: Ogórki)."
          />
          <FAQItem
            question="Jak działa kalendarz księżycowy?"
            answer="Kalendarz księżycowy pokazuje najlepsze dni do siewu, sadzenia i zbioru według faz Księżyca. Dni korzystne oznaczone są zielonym kolorem, a niekorzystne - czerwonym. To sprawdzone metody ogrodnicze!"
          />
          <FAQItem
            question="Co to są rośliny towarzyszące?"
            answer="To system podpowiedzi pokazujący, które rośliny dobrze rosną obok siebie (np. pomidor + bazylia), a których należy unikać (np. pomidor + kapusta). Zobaczysz te podpowiedzi podczas edycji grządki!"
          />
          <FAQItem
            question="Jak działają automatyczne zadania?"
            answer="Aplikacja automatycznie generuje zadania na podstawie Twoich roślin: przypomnienia o zbiorze, podlewaniu, czy upływie karencji po oprysku. Wszystko w jednym miejscu!"
          />
          <FAQItem
            question="Czy mogę śledzić postępy zdjęciami?"
            answer="Tak! W galerii możesz dodawać zdjęcia swoich roślin, tagować je i śledzić jak rosną w czasie. To wspaniała pamiątka sezonu ogrodniczego!"
          />
          <FAQItem
            question="Skąd aplikacja wie o pogodzie?"
            answer="Po ustawieniu lokalizacji w profilu, aplikacja pobiera aktualne dane pogodowe i prognozy dla Twojej okolicy. Możesz zobaczyć temperaturę, opady i wiatr!"
          />
        </div>
      </div>

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

// FAQ Item Component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="px-6 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between text-left"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">
          {question}
        </span>
        <span className={`flex-shrink-0 text-green-600 dark:text-green-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
};

export default Dashboard;
