import React, { useState, useEffect, useCallback } from 'react';
import axios from '../config/axios';
import { CheckSquare, Plus, Calendar, AlertCircle, Sparkles, Trash2, Check, Repeat, Leaf, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Tasks = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Date change dialog state
  const [dateDialog, setDateDialog] = useState(null); // { task, newDate }
  const [dateDialogDate, setDateDialogDate] = useState('');

  // Planting confirmation dialog state
  const [plantingDialog, setPlantingDialog] = useState(null); // { task, planItems, plan }
  const [selectedPlantItems, setSelectedPlantItems] = useState([]);
  const [plantingInProgress, setPlantingInProgress] = useState(false);

  const [newTask, setNewTask] = useState({
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 1,
    task_type: 'custom',
    time_of_day: null,
    is_recurring: false,
    recurrence_frequency: 1,
    recurrence_times: ['anytime']
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/tasks';

      if (filter === 'today') {
        url = '/api/tasks/today';
      } else if (filter === 'completed') {
        url += '?completed=true';
      } else if (filter === 'pending') {
        url += '?completed=false';
      }

      const response = await axios.get(url);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const generateSmartTasks = async () => {
    try {
      await axios.post('/api/tasks/generate');
      showToast('Wygenerowano inteligentne zadania!', 'success');
      fetchTasks();
    } catch (err) {
      console.error('Error generating tasks:', err);
      showToast('Błąd podczas generowania zadań', 'error');
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = { ...newTask };

      if (taskData.is_recurring) {
        taskData.recurrence_times = JSON.stringify(taskData.recurrence_times);
      } else {
        delete taskData.is_recurring;
        delete taskData.recurrence_frequency;
        delete taskData.recurrence_times;
      }

      await axios.post('/api/tasks', taskData);
      setNewTask({
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 1,
        task_type: 'custom',
        time_of_day: null,
        is_recurring: false,
        recurrence_frequency: 1,
        recurrence_times: ['anytime']
      });
      setShowForm(false);
      showToast('Zadanie utworzone', 'success');
      fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
      showToast(err.response?.data?.error || 'Błąd podczas tworzenia zadania', 'error');
    }
  };

  // Handle task completion - check if it's a plan task
  const toggleComplete = async (taskId, currentStatus) => {
    try {
      if (!currentStatus) {
        const task = tasks.find(t => t.id === taskId);

        // If this is a garden plan task, show planting dialog
        if (task && task.garden_plan_id) {
          try {
            const response = await axios.get(`/api/tasks/${taskId}/plan-items`);
            const { plan, items } = response.data;
            const unplantedItems = items.filter(i => !i.planted_at);

            if (unplantedItems.length > 0) {
              setPlantingDialog({ task, planItems: unplantedItems, plan });
              setSelectedPlantItems(unplantedItems.map(i => i.id));
              return;
            }
          } catch (err) {
            console.error('Error loading plan items:', err);
          }
        }

        await axios.post(`/api/tasks/${taskId}/complete`);
      } else {
        await axios.put(`/api/tasks/${taskId}`, { completed: false });
      }
      fetchTasks();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Handle date click for plan tasks
  const handleDateClick = (task) => {
    if (task.garden_plan_id && !task.completed) {
      setDateDialog(task);
      setDateDialogDate(task.due_date || new Date().toISOString().split('T')[0]);
    }
  };

  // Update date (single or all plan tasks)
  const handleDateUpdate = async (updateAll) => {
    if (!dateDialog || !dateDialogDate) return;

    try {
      await axios.put(`/api/tasks/${dateDialog.id}/update-plan-date`, {
        due_date: dateDialogDate,
        update_all: updateAll
      });
      showToast(
        updateAll
          ? 'Zmieniono datę wszystkich zadań z planu'
          : 'Zmieniono datę zadania',
        'success'
      );
      setDateDialog(null);
      fetchTasks();
    } catch (err) {
      showToast('Błąd zmiany daty', 'error');
    }
  };

  // Confirm planting
  const handleConfirmPlanting = async () => {
    if (!plantingDialog || selectedPlantItems.length === 0) return;

    setPlantingInProgress(true);
    try {
      const response = await axios.post(`/api/tasks/${plantingDialog.task.id}/complete-planting`, {
        planted_items: selectedPlantItems
      });
      showToast(response.data.message, 'success');
      setPlantingDialog(null);
      setSelectedPlantItems([]);
      fetchTasks();
    } catch (err) {
      showToast(err.response?.data?.error || 'Błąd potwierdzania sadzenia', 'error');
    } finally {
      setPlantingInProgress(false);
    }
  };

  const togglePlantItem = (itemId) => {
    setSelectedPlantItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      showToast('Zadanie usunięte', 'success');
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Błąd usuwania zadania', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getTaskIcon = (type, gardenPlanId) => {
    if (gardenPlanId) return '🌱';
    const icons = {
      spray: '💧',
      harvest: '🌾',
      water: '💦',
      custom: '📝'
    };
    return icons[type] || '📝';
  };

  const getPriorityColor = (priority) => {
    if (priority >= 3) return 'text-red-600 dark:text-red-400';
    if (priority === 2) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-colors">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CheckSquare size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Zadania</h1>
                <p className="text-white/90 text-sm">Zarządzaj pracami ogrodniczymi</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Wszystkie</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center border border-purple-100 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.pending}</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Do zrobienia</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center border border-green-100 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
              <div className="text-xs text-green-700 dark:text-green-300">Wykonane</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow hover:shadow-md transition-all"
          >
            <Plus size={20} />
            <span className="font-medium">Nowe zadanie</span>
          </button>
          <button
            onClick={generateSmartTasks}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow hover:shadow-md transition-all"
          >
            <Sparkles size={20} />
            <span className="font-medium">Smart AI</span>
          </button>
        </div>

        {/* Create Task Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Nowe zadanie</h3>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Opis zadania *
                </label>
                <input
                  type="text"
                  required
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="np. Podlać pomidory"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Termin
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Priorytet
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value={1}>Niski</option>
                    <option value={2}>Średni</option>
                    <option value={3}>Wysoki</option>
                  </select>
                </div>
              </div>

              {/* Pora dnia */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Pora dnia (opcjonalne)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTask({ ...newTask, time_of_day: 'morning' })}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      newTask.time_of_day === 'morning'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    🌅 Rano
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTask({ ...newTask, time_of_day: 'evening' })}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      newTask.time_of_day === 'evening'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    🌙 Wieczorem
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTask({ ...newTask, time_of_day: null })}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      newTask.time_of_day === null
                        ? 'bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    Dowolnie
                  </button>
                </div>
              </div>

              {/* Recurring Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTask.is_recurring}
                    onChange={(e) => setNewTask({ ...newTask, is_recurring: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <Repeat size={16} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Zadanie cykliczne
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                  Zadanie będzie automatycznie powtarzane
                </p>
              </div>

              {newTask.is_recurring && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-purple-900 dark:text-purple-200 flex items-center gap-2">
                    <Repeat size={16} />
                    Ustawienia cykliczności
                  </h4>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-purple-900 dark:text-purple-200">
                      Częstotliwość
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 7].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setNewTask({ ...newTask, recurrence_frequency: days })}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            newTask.recurrence_frequency === days
                              ? 'bg-purple-600 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                          }`}
                        >
                          {days === 1 ? 'Codziennie' : `Co ${days} dni`}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={newTask.recurrence_frequency}
                      onChange={(e) => setNewTask({ ...newTask, recurrence_frequency: parseInt(e.target.value) || 1 })}
                      className="mt-2 w-full px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Lub wpisz liczbę dni..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-purple-900 dark:text-purple-200">
                      Pory dnia
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'anytime', label: 'Bez określonej pory', icon: '🕐' },
                        { value: 'morning', label: 'Rano (6-12)', icon: '🌅' },
                        { value: 'afternoon', label: 'Popołudnie (12-18)', icon: '☀️' },
                        { value: 'evening', label: 'Wieczór (18-22)', icon: '🌙' }
                      ].map(time => (
                        <label
                          key={time.value}
                          className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={newTask.recurrence_times.includes(time.value)}
                            onChange={(e) => {
                              if (time.value === 'anytime') {
                                setNewTask({ ...newTask, recurrence_times: e.target.checked ? ['anytime'] : [] });
                              } else {
                                const newTimes = e.target.checked
                                  ? [...newTask.recurrence_times.filter(t => t !== 'anytime'), time.value]
                                  : newTask.recurrence_times.filter(t => t !== time.value);
                                setNewTask({ ...newTask, recurrence_times: newTimes.length ? newTimes : ['anytime'] });
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-lg">{time.icon}</span>
                          <span className="text-sm text-purple-900 dark:text-purple-200">{time.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-xs text-purple-800 dark:text-purple-200">
                    <strong>Podgląd:</strong> Zadanie będzie się powtarzać <strong>co {newTask.recurrence_frequency} {newTask.recurrence_frequency === 1 ? 'dzień' : 'dni'}</strong>
                    {newTask.recurrence_times.includes('anytime') ? '' : ` o ${newTask.recurrence_times.map(t => {
                      const labels = { morning: 'rano', afternoon: 'po południu', evening: 'wieczorem' };
                      return labels[t];
                    }).join(', ')}`}.
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Dodaj zadanie
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'pending', label: 'Do zrobienia', count: stats.pending },
            { id: 'today', label: 'Dziś', count: tasks.filter(t => !t.completed && t.due_date === new Date().toISOString().split('T')[0]).length },
            { id: 'completed', label: 'Wykonane', count: stats.completed },
            { id: 'all', label: 'Wszystkie', count: stats.total }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Ładowanie...</div>
          ) : tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">Brak zadań</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dodaj nowe zadanie lub wygeneruj smart AI
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(task.id, task.completed)}
                    className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600'
                        : 'border-gray-300 dark:border-gray-500 hover:border-green-500 dark:hover:border-green-400 bg-white dark:bg-gray-700'
                    }`}
                  >
                    {task.completed && <Check size={16} className="text-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getTaskIcon(task.task_type, task.garden_plan_id)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium text-gray-900 dark:text-gray-100 ${
                            task.completed ? 'line-through' : ''
                          }`}>
                            {task.description}
                          </p>
                          {task.garden_plan_id && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                              <Leaf size={12} />
                              Plan
                            </span>
                          )}
                          {task.is_recurring && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
                              <Repeat size={12} />
                              Co {task.recurrence_frequency} {task.recurrence_frequency === 1 ? 'dzień' : 'dni'}
                            </span>
                          )}
                          {task.parent_task_id && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                              <Repeat size={12} />
                              Auto
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.due_date && (
                            <button
                              onClick={() => handleDateClick(task)}
                              className={`flex items-center gap-1 text-xs ${
                                task.garden_plan_id && !task.completed
                                  ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                                  : 'text-gray-500 dark:text-gray-400 cursor-default'
                              }`}
                            >
                              <Calendar size={12} />
                              <span>{new Date(task.due_date).toLocaleDateString('pl-PL')}</span>
                            </button>
                          )}
                          {task.garden_plan_name && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              ({task.garden_plan_name})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Priority & Actions */}
                  <div className="flex items-center gap-2">
                    <div className={`text-lg ${getPriorityColor(task.priority)}`}>
                      {task.priority >= 3 ? <AlertCircle size={20} /> : null}
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(task.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Usuń zadanie"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗑️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Usuń zadanie?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Ta operacja jest nieodwracalna.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => deleteTask(deleteConfirm)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Change Dialog (for plan tasks) */}
      {dateDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Zmień datę sadzenia
            </h3>
            {dateDialog.garden_plan_name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Plan: {dateDialog.garden_plan_name}
              </p>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nowa data
              </label>
              <input
                type="date"
                value={dateDialogDate}
                onChange={(e) => setDateDialogDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleDateUpdate(false)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Zmień datę tylko tego zadania
              </button>
              <button
                onClick={() => handleDateUpdate(true)}
                className="w-full px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
              >
                Zmień datę wszystkich zadań z planu
              </button>
              <button
                onClick={() => setDateDialog(null)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Planting Confirmation Dialog */}
      {plantingDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Potwierdź sadzenie
              </h3>
              {plantingDialog.plan && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Plan: {plantingDialog.plan.name}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Zaznacz rośliny, które zostały posadzone
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {plantingDialog.planItems.map(item => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPlantItems.includes(item.id)
                      ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlantItems.includes(item.id)}
                    onChange={() => togglePlantItem(item.id)}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.plant_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ilość: {item.quantity || 1} szt.
                    </p>
                  </div>
                  {selectedPlantItems.includes(item.id) && (
                    <Check size={20} className="text-green-600 flex-shrink-0" />
                  )}
                </label>
              ))}

              {/* Select all / none */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlantItems(plantingDialog.planItems.map(i => i.id))}
                  className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                >
                  Zaznacz wszystkie
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlantItems([])}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Odznacz wszystkie
                </button>
              </div>

              {plantingDialog.plan && !plantingDialog.plan.plot_id && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                  Plan nie jest przypisany do poletka - grządki nie zostaną automatycznie utworzone.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <button
                onClick={() => { setPlantingDialog(null); setSelectedPlantItems([]); }}
                disabled={plantingInProgress}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirmPlanting}
                disabled={plantingInProgress || selectedPlantItems.length === 0}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {plantingInProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sadzenie...
                  </>
                ) : (
                  <>
                    <Leaf className="w-4 h-4" />
                    Posadzone ({selectedPlantItems.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
