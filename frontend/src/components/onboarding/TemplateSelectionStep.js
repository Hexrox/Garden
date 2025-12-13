import React, { useState, useEffect } from 'react';
import { Check, Sprout, Leaf, Award } from 'lucide-react';
import axios from '../../config/axios';

const TemplateSelectionStep = ({ interests, selectedTemplate, onSelectTemplate, onSkipTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter templates based on user interests
  const filteredTemplates = React.useMemo(() => {
    if (interests.length === 0 || showAll) {
      return templates;
    }

    return templates.filter(template =>
      template.tags.some(tag => interests.includes(tag))
    );
  }, [templates, interests, showAll]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'Początkujący';
      case 'intermediate':
        return 'Średnio zaawansowany';
      case 'advanced':
        return 'Zaawansowany';
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Wybierz gotowy szablon ogrodu
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Szybki start - wybierz szablon i od razu otrzymasz poletko z grządkami!
        </p>
        {interests.length > 0 && !showAll && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            Pokazujemy szablony pasujące do Twoich zainteresowań
          </p>
        )}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Nie znaleziono szablonów pasujących do Twoich zainteresowań.
          </p>
          <button
            onClick={() => setShowAll(true)}
            className="text-green-600 dark:text-green-400 hover:underline font-medium"
          >
            Pokaż wszystkie szablony →
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-green-600 bg-green-50 dark:bg-green-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    {template.name}
                  </h4>
                  {selectedTemplate?.id === template.id && (
                    <div className="bg-green-600 rounded-full p-1 flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Difficulty Badge */}
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                    <Award className="w-3 h-3" />
                    {getDifficultyLabel(template.difficulty)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {template.description}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    📏 {template.size_m2}m²
                  </span>
                  <span className="flex items-center gap-1">
                    🌱 {template.bed_count} grządek
                  </span>
                  <span className="flex items-center gap-1">
                    ⏱️ {template.estimated_setup_time}
                  </span>
                </div>

                {/* Preview Plants */}
                {template.preview_plants && template.preview_plants.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.preview_plants.slice(0, 5).map((plant, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs"
                      >
                        <Leaf className="w-3 h-3" />
                        {plant}
                      </span>
                    ))}
                    {template.preview_plants.length > 5 && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                        +{template.preview_plants.length - 5} więcej
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Show all button */}
          {interests.length > 0 && !showAll && filteredTemplates.length < templates.length && (
            <div className="text-center">
              <button
                onClick={() => setShowAll(true)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Pokaż wszystkie szablony ({templates.length}) →
              </button>
            </div>
          )}
        </>
      )}

      {/* Skip template button */}
      <button
        onClick={onSkipTemplate}
        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-all text-center font-medium"
      >
        ⏭️ Nie chcę szablonu, stworzę ogród sam →
      </button>

      {selectedTemplate && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-green-600 rounded-full p-2 flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                Wybrany szablon: {selectedTemplate.name}
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                Po zakończeniu onboardingu automatycznie utworzymy dla Ciebie poletko z {selectedTemplate.bed_count} grządkami!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelectionStep;
