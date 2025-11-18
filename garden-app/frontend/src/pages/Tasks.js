import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { CheckSquare, Plus, Calendar, AlertCircle, Sparkles, Trash2, Check } from 'lucide-react';

/**
 * Strona Zadań
 *
 * Pełne zarządzanie zadaniami z:
 * - Automatycznie generowanymi inteligentnymi zadaniami
 * - Ręcznym tworzeniem zadań
 * - Filtrowaniem według statusu
 * - Zarządzaniem priorytetami
 */
const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'completed', 'today'
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 1,
    task_type: 'custom'
  });

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
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
  };

  const generateSmartTasks = async () => {
    try {
      await axios.post('/api/tasks/generate');
      alert('✨ Wygenerowano inteligentne zadania!');
      fetchTasks();
    } catch (err) {
      console.error('Error generating tasks:', err);
      alert('Błąd podczas generowania zadań');
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', newTask);
      setNewTask({
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 1,
        task_type: 'custom'
      });
      setShowForm(false);
      fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Błąd podczas tworzenia zadania');
    }
  };

  const toggleComplete = async (taskId, currentStatus) => {
    try {
      if (!currentStatus) {
        await axios.post(`/api/tasks/${taskId}/complete`);
      } else {
        await axios.put(`/api/tasks/${taskId}`, { completed: false });
      }
      fetchTasks();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Czy na pewno usunąć to zadanie?')) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const getTaskIcon = (type) => {
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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckSquare size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Zadania</h1>
                <p className="text-blue-100 text-sm">Zarządzaj pracami ogrodniczymi</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-blue-100">Wszystkie</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-xs text-blue-100">Do zrobienia</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-xs text-blue-100">Wykonane</div>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">Brak zadań</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Dodaj nowe zadanie lub wygeneruj smart AI
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-all ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(task.id, task.completed)}
                    className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                    }`}
                  >
                    {task.completed && <Check size={16} className="text-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getTaskIcon(task.task_type)}</span>
                      <div className="flex-1">
                        <p className={`font-medium text-gray-900 dark:text-white ${
                          task.completed ? 'line-through' : ''
                        }`}>
                          {task.description}
                        </p>
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar size={12} />
                            <span>{new Date(task.due_date).toLocaleDateString('pl-PL')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority & Actions */}
                  <div className="flex items-center gap-2">
                    <div className={`text-lg ${getPriorityColor(task.priority)}`}>
                      {task.priority >= 3 ? <AlertCircle size={20} /> : null}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-700"
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
    </div>
  );
};

export default Tasks;
