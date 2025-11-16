import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today'); // 'today', 'all', 'completed'

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
        url = '/api/tasks?completed=true';
      }

      const response = await axios.get(url);
      setTasks(response.data);
      setError(null);
    } catch (err) {
      setError('Nie można pobrać zadań');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async () => {
    try {
      await axios.post('/api/tasks/generate');
      fetchTasks();
    } catch (err) {
      console.error('Error generating tasks:', err);
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
    if (priority >= 3) return { text: 'Pilne', color: 'bg-red-100 text-red-800' };
    if (priority === 2) return { text: 'Ważne', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Normalne', color: 'bg-gray-100 text-gray-800' };
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Zadania</h3>
          <button
            onClick={generateTasks}
            className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition"
          >
            Generuj zadania
          </button>
        </div>

        {/* Filtry */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              filter === 'today'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Dzisiaj ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Wszystkie
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ukończone
          </button>
        </div>
      </div>

      {/* Lista zadań */}
      <div className="divide-y max-h-96 overflow-y-auto">
        {error && (
          <div className="p-4 text-center text-red-600">{error}</div>
        )}

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
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
                className={`p-4 hover:bg-gray-50 transition ${
                  task.completed ? 'opacity-60' : ''
                } ${overdue ? 'bg-red-50' : ''}`}
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
                      <span className={`px-2 py-0.5 rounded-full ${priorityInfo.color}`}>
                        {priorityInfo.text}
                      </span>

                      {task.due_date && (
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            overdue
                              ? 'bg-red-100 text-red-800 font-semibold'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          📅 {new Date(task.due_date).toLocaleDateString('pl-PL')}
                          {overdue && ' (zaległe!)'}
                        </span>
                      )}

                      {task.completed && task.completed_at && (
                        <span className="text-gray-500">
                          ✓ {new Date(task.completed_at).toLocaleDateString('pl-PL')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Przycisk usuń */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {tasks.length > 0 && filter !== 'completed' && (
        <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
          {tasks.filter(t => !t.completed).length} zadań do zrobienia
        </div>
      )}
    </div>
  );
};

export default TaskList;
