import React, { useState, useEffect, useMemo } from 'react';
import axios from '../config/axios';
import { Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react';

const SuccessionPlanting = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    plant_name: '',
    interval_days: '',
    last_planted_date: new Date().toISOString().split('T')[0],
    bed_id: ''
  });
  const [beds, setBeds] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  const [timelineMonth, setTimelineMonth] = useState(new Date());

  useEffect(() => {
    fetchReminders();
    fetchBeds();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await axios.get('/api/succession');
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async () => {
    try {
      const plotsResponse = await axios.get('/api/plots');
      const allBeds = [];
      for (const plot of plotsResponse.data) {
        const detailResponse = await axios.get(`/api/plots/${plot.id}/details`);
        if (detailResponse.data.beds) {
          detailResponse.data.beds.forEach(bed => {
            allBeds.push({
              id: bed.id,
              label: `${plot.name} - Rząd ${bed.row_number} (${bed.plant_name || 'Pusty'})`
            });
          });
        }
      }
      setBeds(allBeds);
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const resetForm = () => {
    setForm({
      plant_name: '',
      interval_days: '',
      last_planted_date: new Date().toISOString().split('T')[0],
      bed_id: ''
    });
    setShowForm(false);
    setEditingReminder(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        await axios.put(`/api/succession/${editingReminder.id}`, form);
        setMessage({ type: 'success', text: 'Przypomnienie zaktualizowane!' });
      } else {
        await axios.post('/api/succession', form);
        setMessage({ type: 'success', text: 'Przypomnienie utworzone!' });
      }
      resetForm();
      fetchReminders();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Błąd podczas zapisywania' });
      console.error('Error saving reminder:', error);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setForm({
      plant_name: reminder.plant_name,
      interval_days: reminder.interval_days,
      last_planted_date: reminder.last_planted_date,
      bed_id: reminder.bed_id || ''
    });
    setShowForm(true);
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  const handleDelete = async (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const executeDelete = async (id) => {
    try {
      await axios.delete(`/api/succession/${id}`);
      setMessage({ type: 'success', text: 'Przypomnienie usunięte!' });
      fetchReminders();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas usuwania' });
      console.error('Error deleting reminder:', error);
    }
  };

  const handleToggleActive = async (reminder) => {
    try {
      await axios.put(`/api/succession/${reminder.id}`, {
        ...reminder,
        is_active: !reminder.is_active
      });
      setMessage({ type: 'success', text: reminder.is_active ? 'Dezaktywowano' : 'Aktywowano' });
      fetchReminders();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas aktualizacji' });
      console.error('Error toggling active:', error);
    }
  };

  const handleMarkPlanted = async (id) => {
    try {
      await axios.post(`/api/succession/${id}/complete`);
      setMessage({ type: 'success', text: 'Oznaczono jako posadzone!' });
      fetchReminders();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd podczas aktualizacji' });
      console.error('Error marking as planted:', error);
    }
  };

  const getStatusColor = (nextDate, isActive) => {
    if (!isActive) return 'text-gray-400 dark:text-gray-600';
    const now = new Date();
    const target = new Date(nextDate);
    const daysUntil = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'text-red-600 dark:text-red-400';
    if (daysUntil <= 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔄 Sadzenie Sukcesyjne
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Zaplanuj regularne sadzenie roślin dla ciągłych zbiorów
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
        >
          {showForm ? 'Anuluj' : '+ Dodaj przypomnienie'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {editingReminder ? 'Edytuj przypomnienie' : 'Nowe przypomnienie'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nazwa rośliny *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  value={form.plant_name}
                  onChange={(e) => setForm({ ...form, plant_name: e.target.value })}
                  placeholder="Np. Sałata, Rzodkiewka"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interwał (dni) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  value={form.interval_days}
                  onChange={(e) => setForm({ ...form, interval_days: e.target.value })}
                  placeholder="Np. 14"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data ostatniego posadzenia *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  value={form.last_planted_date}
                  onChange={(e) => setForm({ ...form, last_planted_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grządka (opcjonalnie)
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  value={form.bed_id}
                  onChange={(e) => setForm({ ...form, bed_id: e.target.value })}
                >
                  <option value="">Nie wybrano</option>
                  {beds.map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      {bed.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {editingReminder ? 'Zaktualizuj' : 'Dodaj'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Mode Toggle */}
      {reminders.length > 0 && (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Kalendarz
          </button>
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center transition-colors">
          <p className="text-4xl mb-4">🌱</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Brak zaplanowanych sadzeń sukcesyjnych
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Sadzenie sukcesyjne pozwala uzyskać ciągłe zbiory przez cały sezon. Dodaj przypomnienia dla roślin,
            które chcesz sadzić regularnie co kilka tygodni.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            + Dodaj pierwsze przypomnienie
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        <SuccessionTimeline
          reminders={reminders}
          currentMonth={timelineMonth}
          onMonthChange={setTimelineMonth}
          onMarkPlanted={handleMarkPlanted}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Roślina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Interwał
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ostatnie sadzenie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Następne sadzenie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reminders.map((reminder) => (
                  <tr key={reminder.id} className={!reminder.is_active ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {reminder.plant_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Co {reminder.interval_days} dni
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(reminder.last_planted_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${getStatusColor(reminder.next_planting_date, reminder.is_active)}`}>
                        {formatDate(reminder.next_planting_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reminder.is_active
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {reminder.is_active ? 'Aktywne' : 'Nieaktywne'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {reminder.is_active && (
                          <button
                            onClick={() => handleMarkPlanted(reminder.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Oznacz jako posadzone"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Edytuj"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleToggleActive(reminder)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          title={reminder.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                        >
                          {reminder.is_active ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Usuń"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal potwierdzenia usunięcia */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm({ open: false, id: null })}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usuń przypomnienie</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Czy na pewno usunąć to przypomnienie?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm({ open: false, id: null })} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Anuluj</button>
              <button onClick={() => { executeDelete(deleteConfirm.id); setDeleteConfirm({ open: false, id: null }); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Usuń</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Timeline/Gantt visualization component
const SuccessionTimeline = ({ reminders, currentMonth, onMonthChange, onMarkPlanted }) => {
  // Generate dates for the current month view (6 weeks to show full month with overlap)
  const getDaysInView = useMemo(() => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Start from Monday of the week containing the 1st
    const startDay = new Date(startOfMonth);
    startDay.setDate(startDay.getDate() - ((startDay.getDay() + 6) % 7));

    // End on Sunday of the week containing the last day
    const endDay = new Date(endOfMonth);
    endDay.setDate(endDay.getDate() + (7 - endDay.getDay()) % 7);

    const days = [];
    const current = new Date(startDay);
    while (current <= endDay) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [currentMonth]);

  // Generate planting events for each reminder
  const getPlantingEvents = useMemo(() => {
    const events = [];
    const viewStart = getDaysInView[0];
    const viewEnd = getDaysInView[getDaysInView.length - 1];

    reminders.forEach(reminder => {
      if (!reminder.is_active) return;

      // Start from last planted date and generate future dates
      let plantingDate = new Date(reminder.last_planted_date);

      // Go forward in intervals
      while (plantingDate <= viewEnd) {
        if (plantingDate >= viewStart) {
          events.push({
            id: reminder.id,
            plant_name: reminder.plant_name,
            date: new Date(plantingDate),
            interval_days: reminder.interval_days,
            isPast: plantingDate < new Date(new Date().setHours(0,0,0,0))
          });
        }
        plantingDate = new Date(plantingDate);
        plantingDate.setDate(plantingDate.getDate() + parseInt(reminder.interval_days));
      }
    });

    return events;
  }, [reminders, getDaysInView]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map();
    getPlantingEvents.forEach(event => {
      const dateKey = event.date.toISOString().split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(event);
    });
    return map;
  }, [getPlantingEvents]);

  const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

  const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

  const prevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const today = new Date().toISOString().split('T')[0];

  // Color palette for plants
  const plantColors = useMemo(() => {
    const colors = [
      'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
      'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500'
    ];
    const map = new Map();
    reminders.forEach((r, i) => {
      map.set(r.plant_name, colors[i % colors.length]);
    });
    return map;
  }, [reminders]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
        {reminders.filter(r => r.is_active).map(r => (
          <div key={r.id} className="flex items-center gap-1.5 text-xs">
            <div className={`w-3 h-3 rounded ${plantColors.get(r.plant_name)}`} />
            <span className="text-gray-700 dark:text-gray-300">{r.plant_name}</span>
            <span className="text-gray-400">({r.interval_days}d)</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {getDaysInView.map((day, index) => {
          const dateKey = day.toISOString().split('T')[0];
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = dateKey === today;

          return (
            <div
              key={index}
              className={`min-h-[80px] p-1 border-r border-b border-gray-100 dark:border-gray-700 ${
                !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''
              } ${isToday ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 ${
                isToday
                  ? 'text-green-700 dark:text-green-400'
                  : isCurrentMonth
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.map((event, i) => (
                  <div
                    key={`${event.id}-${i}`}
                    className={`text-xs px-1.5 py-0.5 rounded ${plantColors.get(event.plant_name)} text-white truncate cursor-pointer hover:opacity-80 transition-opacity ${
                      event.isPast ? 'opacity-50' : ''
                    }`}
                    title={`${event.plant_name} - co ${event.interval_days} dni`}
                    onClick={() => !event.isPast && onMarkPlanted(event.id)}
                  >
                    {event.plant_name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 text-center">
        Kliknij na sadzenie aby oznaczyć jako wykonane
      </div>
    </div>
  );
};

export default SuccessionPlanting;
