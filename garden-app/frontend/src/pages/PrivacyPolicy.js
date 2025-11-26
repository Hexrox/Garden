import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Database, Cookie, Lock, Mail } from 'lucide-react';

/**
 * PrivacyPolicy - Polityka Prywatności
 *
 * Zgodna z RODO/GDPR - informuje użytkowników o przetwarzaniu danych osobowych
 */
const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Powrót do strony głównej
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Polityka Prywatności
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
                </p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Niniejsza Polityka Prywatności opisuje w jaki sposób Garden App ("my", "nas", "nasz")
              zbiera, wykorzystuje i chroni dane osobowe użytkowników naszej aplikacji.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <Section
            icon={Database}
            title="1. Jakie dane zbieramy"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          >
            <p className="mb-4">Zbieramy następujące kategorie danych osobowych:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>Dane konta:</strong> nazwa użytkownika, adres email, hasło (zahashowane)</li>
              <li>• <strong>Dane lokalizacyjne:</strong> współrzędne geograficzne, miasto (dla prognozy pogody)</li>
              <li>• <strong>Dane ogrodnicze:</strong> informacje o Twoich działkach, roślinach, zadaniach</li>
              <li>• <strong>Dane techniczne:</strong> data ostatniego logowania, preferencje (tryb ciemny)</li>
              <li>• <strong>Zdjęcia:</strong> opcjonalnie przesyłane zdjęcia roślin i działek</li>
            </ul>
          </Section>

          {/* Section 2 */}
          <Section
            icon={Lock}
            title="2. Cel przetwarzania danych"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
          >
            <p className="mb-4">Przetwarzamy Twoje dane w następujących celach:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>Świadczenie usług:</strong> umożliwienie korzystania z aplikacji, zarządzanie kontem</li>
              <li>• <strong>Funkcje pogodowe:</strong> wyświetlanie prognozy pogody dla Twojej lokalizacji</li>
              <li>• <strong>Personalizacja:</strong> dostosowanie aplikacji do Twoich preferencji</li>
              <li>• <strong>Bezpieczeństwo:</strong> ochrona przed nieautoryzowanym dostępem</li>
              <li>• <strong>Ulepszenia:</strong> analiza użytkowania w celu poprawy aplikacji</li>
            </ul>
          </Section>

          {/* Section 3 */}
          <Section
            icon={Cookie}
            title="3. Pliki cookies"
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
          >
            <p className="mb-4">Wykorzystujemy następujące typy cookies:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>Niezbędne cookies:</strong> token uwierzytelniający (JWT) przechowywany w localStorage</li>
              <li>• <strong>Funkcjonalne cookies:</strong> preferencje użytkownika (tryb ciemny, zgoda na cookies)</li>
              <li>• <strong>Brak cookies śledzących:</strong> nie używamy cookies analitycznych ani reklamowych</li>
            </ul>
            <p className="mt-4">
              Możesz zarządzać cookies poprzez ustawienia przeglądarki, jednak usunięcie niezbędnych
              cookies uniemożliwi korzystanie z aplikacji.
            </p>
          </Section>

          {/* Section 4 */}
          <Section
            icon={Shield}
            title="4. Udostępnianie danych osobom trzecim"
            iconBg="bg-red-100 dark:bg-red-900/30"
            iconColor="text-red-600 dark:text-red-400"
          >
            <p className="mb-4">Udostępniamy Twoje dane następującym stronom trzecim:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>OpenWeatherMap API:</strong> współrzędne geograficzne w celu pobrania prognozy pogody
                (<a href="https://openweathermap.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">polityka prywatności</a>)</li>
            </ul>
            <p className="mt-4">
              <strong>Nie sprzedajemy ani nie wynajmujemy Twoich danych osobowych.</strong> Nie przekazujemy
              danych do celów marketingowych ani reklamowych.
            </p>
          </Section>

          {/* Section 5 */}
          <Section
            icon={Lock}
            title="5. Bezpieczeństwo danych"
            iconBg="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
          >
            <p className="mb-4">Stosujemy następujące środki bezpieczeństwa:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>Szyfrowanie:</strong> połączenia HTTPS, hasła hashowane (bcrypt)</li>
              <li>• <strong>Rate limiting:</strong> ochrona przed atakami brute-force</li>
              <li>• <strong>Bezpieczne przechowywanie:</strong> dane w bazie SQLite z ograniczonym dostępem</li>
              <li>• <strong>Regularne aktualizacje:</strong> systemu i zależności</li>
            </ul>
          </Section>

          {/* Section 6 */}
          <Section
            icon={Database}
            title="6. Okres przechowywania danych"
            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            iconColor="text-indigo-600 dark:text-indigo-400"
          >
            <ul className="space-y-2 ml-4">
              <li>• <strong>Dane konta:</strong> do momentu usunięcia konta lub na żądanie</li>
              <li>• <strong>Dane ogrodnicze:</strong> do momentu usunięcia przez użytkownika</li>
              <li>• <strong>Logi systemowe:</strong> maksymalnie 30 dni (jeśli zbierane)</li>
            </ul>
          </Section>

          {/* Section 7 */}
          <Section
            icon={Mail}
            title="7. Twoje prawa (RODO)"
            iconBg="bg-teal-100 dark:bg-teal-900/30"
            iconColor="text-teal-600 dark:text-teal-400"
          >
            <p className="mb-4">Zgodnie z RODO przysługują Ci następujące prawa:</p>
            <ul className="space-y-2 ml-4">
              <li>• <strong>Prawo dostępu:</strong> możesz uzyskać kopię swoich danych</li>
              <li>• <strong>Prawo do sprostowania:</strong> możesz poprawić nieprawidłowe dane</li>
              <li>• <strong>Prawo do usunięcia:</strong> możesz usunąć swoje konto i dane</li>
              <li>• <strong>Prawo do przenoszenia:</strong> możesz eksportować dane (funkcja Export)</li>
              <li>• <strong>Prawo sprzeciwu:</strong> możesz wycofać zgodę na przetwarzanie</li>
            </ul>
            <p className="mt-4">
              Aby skorzystać z powyższych praw, możesz usunąć konto w ustawieniach profilu lub
              skontaktować się z administratorem.
            </p>
          </Section>

          {/* Section 8 */}
          <Section
            icon={Shield}
            title="8. Zmiany w Polityce Prywatności"
            iconBg="bg-gray-100 dark:bg-gray-700"
            iconColor="text-gray-600 dark:text-gray-400"
          >
            <p>
              Zastrzegamy sobie prawo do aktualizacji niniejszej Polityki Prywatności. O istotnych
              zmianach poinformujemy użytkowników poprzez aplikację lub email. Data ostatniej
              aktualizacji znajduje się na górze dokumentu.
            </p>
          </Section>

          {/* Section 9 */}
          <Section
            icon={Mail}
            title="9. Kontakt"
            iconBg="bg-pink-100 dark:bg-pink-900/30"
            iconColor="text-pink-600 dark:text-pink-400"
          >
            <p className="mb-4">
              W razie pytań dotyczących przetwarzania danych osobowych lub niniejszej Polityki
              Prywatności, skontaktuj się z administratorem danych:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="font-mono text-sm text-gray-800 dark:text-gray-200">
                Garden App<br />
                Email: admin@gardenapp.pl
              </p>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            Powrót do aplikacji
          </Link>
        </div>
      </div>
    </div>
  );
};

// Section component for reusability
const Section = ({ icon: Icon, title, children, iconBg, iconColor }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className={`flex-shrink-0 w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">
          {title}
        </h2>
      </div>
      <div className="ml-16 text-gray-600 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
