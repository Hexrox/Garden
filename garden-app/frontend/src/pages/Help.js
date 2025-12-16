import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Search, ChevronRight, ChevronDown, HelpCircle, Lightbulb, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Help - Poradnik użytkownika Garden App
 *
 * Comprehensive user guide with FAQ, tutorials, and gardening tips
 * Accessible at /pomoc (PUBLIC - marketing tool)
 */
const Help = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set(['quick-start'])); // Start with first section expanded

  useEffect(() => {
    // Fetch markdown content
    fetch('/help/user-guide.md')
      .then(response => response.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading help content:', error);
        setLoading(false);
      });
  }, []);

  // Handle hash scrolling
  useEffect(() => {
    if (!loading && content) {
      const hash = window.location.hash;
      if (hash) {
        // Wait for content to render
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [loading, content]);

  // Parse markdown to extract sections
  const sections = React.useMemo(() => {
    if (!content) return [];

    const lines = content.split('\n');
    const parsed = [];
    let currentSection = null;

    lines.forEach((line, index) => {
      // H2 headers (## Title)
      if (line.startsWith('## ')) {
        if (currentSection) {
          parsed.push(currentSection);
        }

        // Extract custom ID from {#id} syntax
        let title = line.replace('## ', '').trim();
        let id = null;
        const idMatch = title.match(/\{#([^}]+)\}/);
        if (idMatch) {
          id = idMatch[1];
          title = title.replace(/\{#[^}]+\}/, '').trim();
        } else {
          // Generate ID from title if no custom ID
          id = title.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/g, '-');
        }

        currentSection = {
          title: title,
          id: id,
          content: [],
          level: 2
        };
      }
      // H3 headers (### Title)
      else if (line.startsWith('### ')) {
        if (currentSection) {
          // Extract custom ID from {#id} syntax for H3 too
          let h3text = line.replace('### ', '').trim();
          let h3id = null;
          const h3idMatch = h3text.match(/\{#([^}]+)\}/);
          if (h3idMatch) {
            h3id = h3idMatch[1];
            h3text = h3text.replace(/\{#[^}]+\}/, '').trim();
          } else {
            h3id = h3text.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/g, '-');
          }

          currentSection.content.push({
            type: 'h3',
            text: h3text,
            id: h3id
          });
        }
      }
      else if (currentSection) {
        currentSection.content.push({
          type: 'text',
          text: line
        });
      }
    });

    if (currentSection) {
      parsed.push(currentSection);
    }

    return parsed;
  }, [content]);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Filter sections by search query
  const filteredSections = React.useMemo(() => {
    if (!searchQuery.trim()) return sections;

    const query = searchQuery.toLowerCase();
    return sections.filter(section => {
      const titleMatch = section.title.toLowerCase().includes(query);
      const contentMatch = section.content.some(item =>
        item.text.toLowerCase().includes(query)
      );
      return titleMatch || contentMatch;
    });
  }, [sections, searchQuery]);

  // When searching, expand all filtered sections
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedSections(new Set(filteredSections.map(s => s.id)));
    }
  }, [searchQuery, filteredSections]);

  // Render markdown-like content
  const renderContent = (items) => {
    return items.map((item, idx) => {
      if (item.type === 'h3') {
        return (
          <h3
            key={idx}
            id={item.id}
            className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2"
          >
            <ChevronRight size={20} className="text-green-600 dark:text-green-400" />
            {item.text}
          </h3>
        );
      }

      const line = item.text;

      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Unordered list
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-6 text-gray-700 dark:text-gray-300 leading-relaxed">
            {formatText(line.replace(/^[*-] /, ''))}
          </li>
        );
      }

      // Ordered list
      if (/^\d+\. /.test(line)) {
        return (
          <li key={idx} className="ml-6 text-gray-700 dark:text-gray-300 leading-relaxed list-decimal">
            {formatText(line.replace(/^\d+\. /, ''))}
          </li>
        );
      }

      // Code block (```)
      if (line.startsWith('```')) {
        return null; // Skip code fence markers
      }

      // Bold/Italic/Links formatting
      return (
        <p key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
          {formatText(line)}
        </p>
      );
    });
  };

  // Format inline markdown (bold, italic, code, links)
  const formatText = (text) => {
    // First, handle links [text](#id)
    const linkRegex = /\[([^\]]+)\]\((#[^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before link
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      // Add link
      parts.push({ type: 'link', text: match[1], href: match[2] });
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    // If no links found, treat as single text part
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }

    return parts.map((part, i) => {
      if (part.type === 'link') {
        return (
          <a
            key={i}
            href={part.href}
            onClick={(e) => {
              e.preventDefault();
              const element = document.querySelector(part.href);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.pushState(null, '', part.href);
              }
            }}
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline cursor-pointer"
          >
            {part.text}
          </a>
        );
      }

      // Process text for bold, code, etc.
      const textContent = part.content;
      const boldParts = textContent.split(/(\*\*.*?\*\*)/g);

      return boldParts.map((boldPart, j) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return <strong key={`${i}-${j}`} className="font-bold text-gray-900 dark:text-white">{boldPart.slice(2, -2)}</strong>;
        }

        // Inline code (`code`)
        if (boldPart.includes('`')) {
          const codeParts = boldPart.split(/(`[^`]+`)/g);
          return codeParts.map((cp, k) => {
            if (cp.startsWith('`') && cp.endsWith('`')) {
              return (
                <code key={`${i}-${j}-${k}`} className="bg-green-50 dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-mono text-green-700 dark:text-green-400 border border-green-200 dark:border-gray-700">
                  {cp.slice(1, -1)}
                </code>
              );
            }
            return cp;
          });
        }

        return boldPart;
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Ładowanie poradnika...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Public Header - gdy niezalogowany */}
      {!isAuthenticated && (
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl">🌱</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">Garden App</span>
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
                >
                  Zaloguj się
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition shadow-md"
                >
                  Załóż konto
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="max-w-5xl mx-auto px-4 py-4 lg:py-8">
        {/* CTA Banner - tylko dla niezalogowanych */}
        {!isAuthenticated && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 lg:p-8 text-white">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                  Poznaj Garden App - Twojego cyfrowego asystenta ogrodnika
                </h2>
                <p className="text-green-50 text-lg">
                  10+ modułów automatyzujących 80% pracy w ogrodzie. 100% za darmo.
                </p>
              </div>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition shadow-lg flex items-center gap-2 flex-shrink-0"
              >
                Wypróbuj za darmo
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Back button - tylko dla zalogowanych */}
        {isAuthenticated && (
          <Link
            to="/dashboard"
            className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 mb-4 transition"
          >
            <ChevronRight size={20} className="mr-2 rotate-180" />
            Powrót do aplikacji
          </Link>
        )}

        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Poradnik Garden App
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Kompleksowy przewodnik po aplikacji dla ogrodników-hobbystów
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Szukaj w poradniku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 lg:mb-8">
        <a
          href="#quick-start"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Szybki Start</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pierwsze kroki w aplikacji - 4 proste etapy
          </p>
        </a>

        <a
          href="#faq"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">FAQ</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Najczęściej zadawane pytania i odpowiedzi
          </p>
        </a>

        <a
          href="#porady-ogrodnicze"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Porady</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Praktyczne wskazówki dla ogrodników
          </p>
        </a>
      </div>

      {/* Content Sections */}
      {filteredSections.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Nie znaleziono wyników dla "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((section, idx) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <div
                key={idx}
                id={section.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden scroll-mt-4"
              >
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 lg:p-8 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                  <div className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="px-6 lg:px-8 pb-6 lg:pb-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="prose prose-green dark:prose-invert max-w-none pt-6">
                      {renderContent(section.content)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

        {/* CTA Footer - tylko dla niezalogowanych */}
        {!isAuthenticated && (
          <div className="mt-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 lg:p-12 text-white text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Przekonany? Zacznij korzystać już dziś!
            </h2>
            <p className="text-xl text-green-50 mb-6 max-w-2xl mx-auto">
              Wszystkie funkcje opisane w poradniku czekają na Ciebie.
              Załóż darmowe konto i zautomatyzuj swój ogród w 5 minut.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/register')}
                className="px-10 py-4 bg-white text-green-600 font-bold text-lg rounded-xl hover:bg-green-50 transition shadow-lg flex items-center gap-2"
              >
                Załóż konto za darmo
                <ArrowRight size={24} />
              </button>
              <Link
                to="/login"
                className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition"
              >
                Mam już konto
              </Link>
            </div>
            <p className="mt-6 text-sm text-green-100">
              ✓ 100% za darmo &nbsp;•&nbsp; ✓ Bez reklam &nbsp;•&nbsp; ✓ Bez limitu funkcji
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Garden App © 2025 | Wersja poradnika: {new Date().toLocaleDateString('pl-PL')}</p>
          {!isAuthenticated && (
            <p className="mt-2">
              <Link to="/privacy-policy" className="text-green-600 dark:text-green-400 hover:underline">
                Polityka Prywatności
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Help;
