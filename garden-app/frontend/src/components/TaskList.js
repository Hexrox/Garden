import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today'); // 'today', 'all', 'completed'
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasAnyTasks, setHasAnyTasks] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  useEffect(() => {
    checkIfHasAnyTasks();
  }, []);

  const checkIfHasAnyTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setHasAnyTasks(response.data.length > 0);
    } catch (err) {
      console.error('Error checking tasks:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = '/api/tasks';

      if (filter === 'today') {
        url = '/api/tasks/today';
      } else if (filter === 'completed') {
        url = '/api/tasks?completed=true';
      }

      const response = await axios.get(url);
      setTasks(response.data);
      setError(null);

      // Check if user has any tasks (regardless of filter) - only when filter is 'all'
      if (filter === 'all') {
        setHasAnyTasks(response.data.length > 0);
      }
    } catch (err) {
      setError('Nie można pobrać zadań');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async () => {
    try {
      setGenerating(true);
      setMessage({ type: '', text: '' });
      const response = await axios.post('/api/tasks/generate');
      setMessage({
        type: 'success',
        text: response.data.message || `Wygenerowano ${response.data.tasks?.length || 0} zadań`
      });
      await fetchTasks();
      await checkIfHasAnyTasks();
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Error generating tasks:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Błąd podczas generowania zadań'
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleTaskComplete = async (taskId, currentStatus) => {
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

  const dismissTask = async (taskId) => {
    try {
      await axios.post(`/api/tasks/${taskId}/dismiss`);
      setMessage({ type: 'success', text: 'Zadanie odrzucone - nie pojawi się przez 14 dni' });
      fetchTasks();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error dismissing task:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Błąd' });
    }
  };

  const snoozeTask = async (taskId, days) => {
    try {
      await axios.post(`/api/tasks/${taskId}/snooze`, { days });
      setMessage({ type: 'success', text: `Zadanie przesunięte o ${days} dni` });
      fetchTasks();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error snoozing task:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Błąd' });
    }
  };

  const getTaskIcon = (type) => {
    const icons = {
      spray: '🌿',
      harvest: '🍅',
      water: '💧',
      custom: '📝'
    };
    return icons[type] || '📝';
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 3) return { text: 'Pilne', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' };
    if (priority === 2) return { text: 'Ważne', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' };
    return { text: 'Normalne', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' };
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Zadania</h3>
          <button
            onClick={generateTasks}
            disabled={generating}
            className={`text-sm px-3 py-1 rounded-lg transition ${
              generating
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
            } text-white`}
          >
            {generating ? 'Generowanie...' : (hasAnyTasks ? '🔄 Odśwież zadania' : '✨ Generuj zadania')}
          </button>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div
            className={`mb-3 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Filtry */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              filter === 'today'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Dzisiaj ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Wszystkie
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Ukończone
          </button>
        </div>
      </div>

      {/* Lista zadań */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {error && (
          <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>
        )}

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {filter === 'completed' ? (
              <>
                <span className="text-4xl block mb-2">✅</span>
                Brak ukończonych zadań
              </>
            ) : (
              <>
                <span className="text-4xl block mb-2">🎉</span>
                Brak zadań do zrobienia!
              </>
            )}
          </div>
        ) : (
          tasks.map((task) => {
            const priorityInfo = getPriorityLabel(task.priority);
            const overdue = isOverdue(task.due_date) && !task.completed;

            return (
              <div
                key={task.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition ${
                  task.completed ? 'opacity-60' : ''
                } ${overdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTaskComplete(task.id, task.completed)}
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                      task.completed
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 hover:border-green-600'
                    }`}
                  >
                    {task.completed && <span className="text-sm">✓</span>}
                  </button>

                  {/* Treść zadania */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getTaskIcon(task.task_type)}</span>
                      <h4
                        className={`font-medium text-gray-900 ${
                          task.completed ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {task.description}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {task.auto_generated && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          ✨ Auto
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full ${priorityInfo.color}`}>
                        {priorityInfo.text}
                      </span>

                      {task.due_date && (
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            overdue
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 font-semibold'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          📅 {new Date(task.due_date).toLocaleDateString('pl-PL')}
                          {overdue && ' (zaległe!)'}
                        </span>
                      )}

                      {task.completed && task.completed_at && (
                        <span className="text-gray-500 dark:text-gray-400">
                          ✓ {new Date(task.completed_at).toLocaleDateString('pl-PL')}
                        </span>
                      )}
                    </div>

                    {/* Auto-generated task actions */}
                    {task.auto_generated && !task.completed && (
                      <div className="flex flex-wrap gap-1 mt-2 text-xs">
                        <button
                          onClick={() => snoozeTask(task.id, 1)}
                          className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                          title="Przypomnij jutro"
                        >
                          ⏰ 1d
                        </button>
                        <button
                          onClick={() => snoozeTask(task.id, 3)}
                          className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                          title="Przypomnij za 3 dni"
                        >
                          ⏰ 3d
                        </button>
                        <button
                          onClick={() => snoozeTask(task.id, 7)}
                          className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                          title="Przypomnij za tydzień"
                        >
                          ⏰ 7d
                        </button>
                        <button
                          onClick={() => dismissTask(task.id)}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                          title="Nie pokazuj więcej"
                        >
                          ❌ Odrzuć
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Przycisk usuń (tylko dla ręcznych zadań) */}
                  {!task.auto_generated && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {tasks.length > 0 && filter !== 'completed' && (
        <div className="p-3 bg-gray-50 dark:bg-gray-750 text-center text-sm text-gray-600 dark:text-gray-400">
          {tasks.filter(t => !t.completed).length} zadań do zrobienia
        </div>
      )}
    </div>
  );
};

export default TaskList;
