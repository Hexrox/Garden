import React, { useState, useEffect, useCallback } from 'react';
import axios from '../config/axios';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today'); // 'today', 'all', 'completed'
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasAnyTasks, setHasAnyTasks] = useState(false);

  // Swipe state
  const [swipeState, setSwipeState] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Animation state
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [completedToday, setCompletedToday] = useState(0);

  // Drag & drop state (desktop only)
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const fetchTasks = useCallback(async () => {
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

      // Calculate completed today
      const today = new Date().toDateString();
      const todayCompleted = response.data.filter(
        t => t.completed && t.completed_at && new Date(t.completed_at).toDateString() === today
      ).length;
      setCompletedToday(todayCompleted);

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
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    checkIfHasAnyTasks();
    // Detect if touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const checkIfHasAnyTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setHasAnyTasks(response.data.length > 0);
    } catch (err) {
      console.error('Error checking tasks:', err);
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
        // Animacja przed ukończeniem
        setCompletingTaskId(taskId);
        await new Promise(resolve => setTimeout(resolve, 300)); // Delay dla animacji

        await axios.post(`/api/tasks/${taskId}/complete`);

        // Sukces!
        setMessage({ type: 'success', text: '🎉 Świetna robota! Zadanie ukończone!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        await axios.put(`/api/tasks/${taskId}`, { completed: false });
      }

      setCompletingTaskId(null);
      fetchTasks();
    } catch (err) {
      console.error('Error toggling task:', err);
      setCompletingTaskId(null);
      setMessage({ type: 'error', text: 'Błąd podczas oznaczania zadania' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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

  // Swipe handlers
  const minSwipeDistance = 100; // Minimum distance for swipe

  const onTouchStart = (e, taskId) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeState({ ...swipeState, [taskId]: 0 });
  };

  const onTouchMove = (e, taskId) => {
    setTouchEnd(e.targetTouches[0].clientX);
    if (touchStart) {
      const distance = e.targetTouches[0].clientX - touchStart;
      setSwipeState({ ...swipeState, [taskId]: distance });
    }
  };

  const onTouchEnd = (taskId, task) => {
    if (!touchStart || !touchEnd) return;

    const distance = touchEnd - touchStart;
    const isLeftSwipe = distance < -minSwipeDistance;
    const isRightSwipe = distance > minSwipeDistance;

    if (isRightSwipe && !task.completed) {
      // Swipe right = Wykonane
      toggleTaskComplete(taskId, false);
      setMessage({ type: 'success', text: '✓ Zadanie wykonane!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } else if (isLeftSwipe && task.auto_generated && !task.completed) {
      // Swipe left = Odrzuć
      dismissTask(taskId);
    }

    // Reset swipe
    setSwipeState({ ...swipeState, [taskId]: 0 });
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Drag & Drop handlers (desktop only)
  const handleDragStart = (e, task) => {
    if (isTouchDevice) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    if (isTouchDevice) return;
    e.currentTarget.style.opacity = '1';
    setDraggedTask(null);
    setDragOverTask(null);
  };

  const handleDragOver = (e) => {
    if (isTouchDevice) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, task) => {
    if (isTouchDevice) return;
    setDragOverTask(task);
  };

  const handleDrop = async (e, targetTask) => {
    if (isTouchDevice) return;
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTask || draggedTask.id === targetTask.id) {
      return;
    }

    // Find indices
    const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id);
    const targetIndex = tasks.findIndex(t => t.id === targetTask.id);

    // Reorder tasks array
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, removed);

    // Assign new priorities based on position (higher priority = first in list)
    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      priority: newTasks.length - index // Reverse so first = highest priority
    }));

    // Optimistic update
    setTasks(updatedTasks);

    // Send to backend
    try {
      await axios.put('/api/tasks/reorder', {
        tasks: updatedTasks.map(t => ({ id: t.id, priority: t.priority }))
      });
    } catch (error) {
      console.error('Error reordering tasks:', error);
      // Reload on error to restore original order
      fetchTasks();
    }

    setDraggedTask(null);
    setDragOverTask(null);
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
                draggable={!isTouchDevice && !task.completed}
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, task)}
                onDrop={(e) => handleDrop(e, task)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all relative overflow-hidden ${
                  task.completed ? 'opacity-60' : ''
                } ${overdue ? 'bg-red-50 dark:bg-red-900/20' : ''}
                ${completingTaskId === task.id ? 'animate-pulse bg-green-50 dark:bg-green-900/20' : ''}
                ${!isTouchDevice && !task.completed ? 'cursor-move' : ''}
                ${dragOverTask?.id === task.id ? 'bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-500' : ''}`}
                onTouchStart={(e) => onTouchStart(e, task.id)}
                onTouchMove={(e) => onTouchMove(e, task.id)}
                onTouchEnd={() => onTouchEnd(task.id, task)}
                style={{
                  transform: swipeState[task.id] ? `translateX(${swipeState[task.id]}px)` : 'translateX(0)',
                  transition: swipeState[task.id] === 0 ? 'transform 0.3s ease-out' : 'none',
                  opacity: completingTaskId === task.id ? 0.7 : 1
                }}
              >
                {/* Swipe indicators - pokazują się podczas swipe */}
                {swipeState[task.id] > 50 && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl opacity-70">
                    ✓
                  </div>
                )}
                {swipeState[task.id] < -50 && task.auto_generated && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl opacity-70">
                    ❌
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  {/* Checkbox - większy i z tooltipem */}
                  <button
                    onClick={() => toggleTaskComplete(task.id, task.completed)}
                    className={`flex-shrink-0 w-8 h-8 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110 ${
                      task.completed
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-600 dark:hover:border-green-500'
                    }`}
                    title={task.completed ? "Oznacz jako niewykonane" : "Oznacz jako wykonane"}
                  >
                    {task.completed && <span className="text-base sm:text-sm">✓</span>}
                  </button>

                  {/* Treść zadania */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getTaskIcon(task.task_type)}</span>
                      <h4
                        className={`font-medium text-gray-900 dark:text-white ${
                          task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
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

                    {/* Task actions - dla wszystkich nieukończonych zadań */}
                    {!task.completed && (
                      <div className="flex flex-wrap gap-1 mt-2 text-xs">
                        {/* Przycisk "Wykonane" - GŁÓWNY CTA */}
                        <button
                          onClick={() => toggleTaskComplete(task.id, false)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-sm"
                          title="Oznacz jako wykonane"
                        >
                          ✓ Wykonane
                        </button>

                        {/* Auto-generated task actions */}
                        {task.auto_generated && (
                          <>
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
                          </>
                        )}
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

      {/* Podsumowanie dnia - gratulacje! */}
      {completedToday > 0 && filter === 'today' && tasks.filter(t => !t.completed).length === 0 && (
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-center border-t border-gray-200 dark:border-gray-700">
          <div className="text-5xl mb-3 animate-bounce">🎉</div>
          <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
            Świetna robota!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Ukończono {completedToday} {completedToday === 1 ? 'zadanie' : 'zadań'} dzisiaj!
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            Twój ogród jest w świetnych rękach! 🌱
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
