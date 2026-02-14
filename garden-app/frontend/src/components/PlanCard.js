import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Calendar,
  Edit,
  Trash2,
  Cloud,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  MapPin,
  Loader2
} from 'lucide-react';
import axios from '../config/axios';

// Kolory dla typów akcji
const ACTION_COLORS = {
  plant: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  spray: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  water: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  harvest: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  transplant: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  fertilize: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  prune: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  custom: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
};

const PlanCard = ({
  plan,
  onComplete,
  onReschedule,
  onCancel,
  onDelete,
  onEdit,
  readonly = false
}) => {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Stan dla modalu wykonania planu sadzenia
  const [showPlantComplete, setShowPlantComplete] = useState(false);
  const [occupiedRows, setOccupiedRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState('');
  const [plantVariety, setPlantVariety] = useState('');
  const [plantNote, setPlantNote] = useState('');
  const [loadingRows, setLoadingRows] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const actionInfo = plan.action_info || { icon: '📝', label: 'Plan' };
  const isOverdue = plan.status === 'planned' && plan.planned_date < new Date().toISOString().split('T')[0];
  const isToday = plan.planned_date === new Date().toISOString().split('T')[0];
  const daysUntil = plan.days_until ?? Math.ceil(
    (new Date(plan.planned_date) - new Date()) / (1000 * 60 * 60 * 24)
  );

  // Czy to plan sadzenia z poletkiem?
  const isPlantWithPlot = plan.action_type === 'plant' && plan.plot_id;

  // Pobierz zajęte rzędy gdy otwieramy modal
  useEffect(() => {
    if (showPlantComplete && plan.plot_id) {
      setLoadingRows(true);
      axios.get(`/api/plots/${plan.plot_id}/beds`)
        .then(res => {
          const rows = res.data.map(bed => bed.row_number);
          setOccupiedRows(rows);
          // Znajdź pierwszy wolny rząd
          let freeRow = 1;
          while (rows.includes(freeRow)) freeRow++;
          setSelectedRow(freeRow.toString());
        })
        .catch(err => {
          console.error('Błąd pobierania grządek:', err);
        })
        .finally(() => {
          setLoadingRows(false);
        });
    }
  }, [showPlantComplete, plan.plot_id]);

  // Obsługa wykonania planu sadzenia
  const handlePlantComplete = async () => {
    setCompleteError('');
    const rowNum = parseInt(selectedRow);

    if (!rowNum || rowNum < 1) {
      setCompleteError('Podaj prawidłowy numer rzędu');
      return;
    }

    if (occupiedRows.includes(rowNum)) {
      setCompleteError(`Rząd ${rowNum} jest już zajęty`);
      return;
    }

    try {
      await onComplete(plan.id, true, {
        row_number: rowNum,
        plant_variety: plantVariety || null,
        note: plantNote || null
      });
      setShowPlantComplete(false);
      setSelectedRow('');
      setPlantVariety('');
      setPlantNote('');
    } catch (error) {
      setCompleteError(error.response?.data?.error || 'Błąd wykonywania planu');
    }
  };

  // Kliknięcie "Wykonaj" - sprawdź czy to plan sadzenia
  const handleCompleteClick = () => {
    if (isPlantWithPlot) {
      setShowPlantComplete(true);
    } else {
      onComplete(plan.id);
    }
  };

  // Formatuj datę po polsku
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const handleRescheduleSubmit = () => {
    if (!newDate) return;
    onReschedule(plan.id, newDate, rescheduleReason);
    setShowReschedule(false);
    setNewDate('');
    setRescheduleReason('');
  };

  return (
    <div className={`p-4 ${isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Ikona typu */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${ACTION_COLORS[plan.action_type] || ACTION_COLORS.custom}`}>
          <span className="text-2xl">{actionInfo.icon}</span>
        </div>

        {/* Treść */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {plan.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                {/* Data */}
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : isToday ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}>
                  <Calendar size={14} />
                  {isToday ? 'Dziś' : isOverdue ? `${Math.abs(daysUntil)} dni temu` : formatDate(plan.planned_date)}
                </span>

                {/* Poletko */}
                {plan.plot_name && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {plan.plot_name}
                  </span>
                )}

                {/* Roślina */}
                {(plan.plant_name || plan.plant_display_name) && (
                  <span className="text-green-600 dark:text-green-400">
                    {plan.plant_display_name || plan.plant_name}
                  </span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {plan.weather_dependent && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full flex items-center gap-1">
                  <Cloud size={12} />
                  Pogoda
                </span>
              )}
              {plan.is_recurring && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full flex items-center gap-1">
                  <RefreshCw size={12} />
                  Cykliczny
                </span>
              )}
              {isOverdue && (
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Zaległy
                </span>
              )}
              {plan.status === 'completed' && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full flex items-center gap-1">
                  <Check size={12} />
                  Wykonane
                </span>
              )}
            </div>
          </div>

          {/* Notatki */}
          {plan.notes && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {plan.notes}
            </p>
          )}

          {/* Data wykonania */}
          {plan.completed_date && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Wykonano: {formatDate(plan.completed_date)}
            </p>
          )}

          {/* Akcje */}
          {!readonly && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Wykonaj */}
              <button
                onClick={handleCompleteClick}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check size={16} />
                Wykonaj
              </button>

              {/* Przesuń */}
              <button
                onClick={() => setShowReschedule(!showReschedule)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Calendar size={16} />
                Przesuń
              </button>

              {/* Edytuj */}
              <button
                onClick={() => onEdit(plan)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Edit size={16} />
                Edytuj
              </button>

              {/* Anuluj/Usuń */}
              <button
                onClick={() => plan.status === 'planned' ? onCancel(plan.id) : onDelete(plan.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {plan.status === 'planned' ? <X size={16} /> : <Trash2 size={16} />}
                {plan.status === 'planned' ? 'Anuluj' : 'Usuń'}
              </button>
            </div>
          )}

          {/* Dla readonly - tylko przycisk usuwania */}
          {readonly && onDelete && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onDelete(plan.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={16} />
                Usuń
              </button>
            </div>
          )}

          {/* Formularz przesunięcia */}
          {showReschedule && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Przesuń na nowy termin
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Nowa data
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Powód (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="np. Zła pogoda"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReschedule(false)}
                    className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleRescheduleSubmit}
                    disabled={!newDate}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Przesuń
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formularz wykonania planu sadzenia */}
          {showPlantComplete && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                🌱 Dodaj do grządki
              </h4>

              {loadingRows ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Wybór numeru rzędu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Numer rzędu *
                    </label>
                    <select
                      value={selectedRow}
                      onChange={(e) => setSelectedRow(e.target.value)}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                    >
                      {/* Generuj opcje 1-20, oznaczając zajęte */}
                      {[...Array(20)].map((_, i) => {
                        const rowNum = i + 1;
                        const isOccupied = occupiedRows.includes(rowNum);
                        return (
                          <option
                            key={rowNum}
                            value={rowNum}
                            disabled={isOccupied}
                          >
                            Rząd {rowNum} {isOccupied ? '(zajęty)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {occupiedRows.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Zajęte rzędy: {occupiedRows.sort((a, b) => a - b).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Odmiana (opcjonalnie) */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Odmiana (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      value={plantVariety}
                      onChange={(e) => setPlantVariety(e.target.value)}
                      placeholder="np. Malinowy, Cherry"
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Notatka (opcjonalnie) */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Notatka (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      value={plantNote}
                      onChange={(e) => setPlantNote(e.target.value)}
                      placeholder="np. Sadzonki z własnego rozsadu"
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Błąd */}
                  {completeError && (
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg">
                      {completeError}
                    </div>
                  )}

                  {/* Przyciski */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowPlantComplete(false);
                        setCompleteError('');
                      }}
                      className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handlePlantComplete}
                      disabled={!selectedRow || occupiedRows.includes(parseInt(selectedRow))}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <Check size={16} />
                      Posadź w rzędzie {selectedRow}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
