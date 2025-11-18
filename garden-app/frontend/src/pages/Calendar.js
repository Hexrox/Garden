import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

/**
 * Strona Kalendarza
 *
 * Piękny kalendarz ogrodowy z:
 * - Widokiem miesiąca z kolorowymi wydarzeniami
 * - Integracją z zadaniami, przypomnieniami, sadzeniem sukcesywnym, opryskimi
 * - Kliknięciem aby zobaczyć szczegóły dnia
 * - Układem siatki zoptymalizowanym na urządzenia mobilne
 */
const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Fetch all event types for the month
      const [tasks, reminders, succession, sprays] = await Promise.all([
        axios.get(`/api/tasks`).catch(() => ({ data: [] })),
        axios.get(`/api/reminders`).catch(() => ({ data: [] })),
        axios.get(`/api/succession/reminders`).catch(() => ({ data: [] })),
        axios.get(`/api/spray-history`).catch(() => ({ data: [] }))
      ]);

      // Combine and format events
      const allEvents = [
        ...tasks.data.map(t => ({
          date: t.due_date,
          type: 'task',
          title: t.description,
          color: 'bg-blue-500',
          completed: t.completed
        })),
        ...reminders.data.map(r => ({
          date: r.reminder_date,
          type: 'reminder',
          title: r.message,
          color: 'bg-purple-500',
          isRead: r.is_read
        })),
        ...succession.data.map(s => ({
          date: s.reminder_date,
          type: 'succession',
          title: `Sadzenie: ${s.plant_name}`,
          color: 'bg-green-500'
        })),
        ...sprays.data.map(s => ({
          date: s.spray_date,
          type: 'spray',
          title: `Oprysk: ${s.spray_name}`,
          color: 'bg-red-500'
        }))
      ];

      setEvents(allEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Monday = 0

  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === month &&
           today.getFullYear() === year;
  };

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < adjustedStartDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CalendarIcon size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Kalendarz Ogrodnika</h1>
                <p className="text-purple-100 text-sm">Planuj i śledź prace</p>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
            <button
              onClick={previousMonth}
              className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-bold">{monthNames[month]} {year}</h2>
            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Zadania</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Przypomnienia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Sadzenie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Opryski</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Day names */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {dayNames.map((day) => (
              <div
                key={day}
                className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="bg-gray-50 dark:bg-gray-900 aspect-square"></div>;
              }

              const dayEvents = getEventsForDay(day);
              const isTodayDay = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay({ day, events: dayEvents })}
                  className={`bg-white dark:bg-gray-800 p-2 aspect-square hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative ${
                    isTodayDay ? 'ring-2 ring-purple-500 ring-inset' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {day}
                  </div>

                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${event.color}`}
                        ></div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Details Modal */}
        {selectedDay && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDay(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedDay.day} {monthNames[month]}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedDay.events.length} wydarzeń
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Events List */}
              <div className="p-6 space-y-3">
                {selectedDay.events.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Brak wydarzeń tego dnia
                  </p>
                ) : (
                  selectedDay.events.map((event, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                    >
                      <div className={`w-3 h-3 rounded-full ${event.color} mt-1 flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {event.type === 'task' && 'Zadanie'}
                          {event.type === 'reminder' && 'Przypomnienie'}
                          {event.type === 'succession' && 'Sadzenie sukcesywne'}
                          {event.type === 'spray' && 'Oprysk'}
                        </p>
                      </div>
                      {event.completed && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
