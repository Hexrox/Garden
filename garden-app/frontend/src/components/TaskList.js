import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Check, AlertTriangle, Cloud, ClipboardList, Calendar, Grid3X3 } from 'lucide-react';
import axios from '../config/axios';
import { useToast } from '../context/ToastContext';

// Helper: Polish declination for numbers
const declination = (n, one, few, many) => {
  if (n === 1) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few;
  return many;
};

// Helper: Get type label in Polish
const getTypeLabel = (type) => ({
  water: 'Podlewanie',
  spray: 'Opryski',
  harvest: 'Zbiory',
  custom: 'Inne zadania'
}[type] || 'Zadania');

// Helper: Get time of day label
const getTimeLabel = (timeOfDay) => ({
  morning: { icon: '🌅', text: 'Rano' },
  evening: { icon: '🌙', text: 'Wieczorem' },
  anytime: { icon: '', text: '' }
}[timeOfDay] || { icon: '', text: '' });

// Helper: Get color scheme for task type
const getTypeColors = (type) => ({
  water: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200',
    icon: '💧'
  },
  spray: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200',
    icon: '🌿'
  },
  harvest: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200',
    icon: '🍅'
  },
  custom: {
    bg: 'bg-gray-50 dark:bg-gray-700/50',
    border: 'border-gray-200 dark:border-gray-600',
    badge: 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
    icon: '📝'
  }
}[type] || {
  bg: 'bg-gray-50 dark:bg-gray-700/50',
  border: 'border-gray-200 dark:border-gray-600',
  badge: 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
  icon: '📝'
});

const TaskList = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today'); // 'today', 'all', 'completed'
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasAnyTasks, setHasAnyTasks] = useState(false);

  // Ref for tracking timers to cleanup on unmount
  const timersRef = useRef([]);
  const isMountedRef = useRef(true);

  // Grouping state
  const [expandedGroups, setExpandedGroups] = useState({});

  // Harvests & Plans state (integrated sections)
  const [harvests, setHarvests] = useState([]);
  const [harvestsLoading, setHarvestsLoading] = useState(true);
  const [harvestsExpanded, setHarvestsExpanded] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansExpanded, setPlansExpanded] = useState(false);
  const [gardenPlans, setGardenPlans] = useState([]);
  const [gardenPlansLoading, setGardenPlansLoading] = useState(true);
  const [gardenPlansExpanded, setGardenPlansExpanded] = useState(false);

  // Swipe state
  const [swipeState, setSwipeState] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Animation state
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  // Cleanup timers on unmount and track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Helper to set timeout with auto-cleanup
  const safeSetTimeout = useCallback((callback, delay) => {
    const timer = setTimeout(() => {
      callback();
      // Remove from tracking array after execution
      timersRef.current = timersRef.current.filter(t => t !== timer);
    }, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const checkIfHasAnyTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setHasAnyTasks(response.data.length > 0);
    } catch (err) {
      console.error('Error checking tasks:', err);
    }
  };

  // Fetch upcoming harvests
  const fetchHarvests = async () => {
    try {
      setHarvestsLoading(true);
      const response = await axios.get('/api/harvest/upcoming?limit=5&days=30');
      setHarvests(response.data);
    } catch (err) {
      console.error('Error fetching harvests:', err);
    } finally {
      setHarvestsLoading(false);
    }
  };

  // Fetch garden plans
  const fetchGardenPlans = async () => {
    try {
      setGardenPlansLoading(true);
      const response = await axios.get('/api/garden-plans/upcoming/all?limit=5');
      setGardenPlans(response.data);
    } catch (err) {
      console.error('Error fetching garden plans:', err);
    } finally {
      setGardenPlansLoading(false);
    }
  };

  // Fetch upcoming plans
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await axios.get('/api/planner/upcoming?limit=5');
      setPlans(response.data);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  // Load harvests and plans on mount
  useEffect(() => {
    fetchHarvests();
    fetchPlans();
    fetchGardenPlans();
  }, []);

  // Handle plan completion
  const handleCompletePlan = async (planId) => {
    try {
      await axios.post(`/api/planner/${planId}/complete`);
      showToast('Plan oznaczony jako wykonany', 'success');
      fetchPlans();
    } catch (error) {
      console.error('Error completing plan:', error);
      showToast('Błąd oznaczania planu', 'error');
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
      safeSetTimeout(() => setMessage({ type: '', text: '' }), 5000);
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
        await new Promise(resolve => {
          const timer = setTimeout(resolve, 300);
          timersRef.current.push(timer);
        });

        // Check if still mounted after delay
        if (!isMountedRef.current) return;

        await axios.post(`/api/tasks/${taskId}/complete`);

        // Check again after API call
        if (!isMountedRef.current) return;

        // Sukces!
        setMessage({ type: 'success', text: '🎉 Świetna robota! Zadanie ukończone!' });
        safeSetTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        await axios.put(`/api/tasks/${taskId}`, { completed: false });
        if (!isMountedRef.current) return;
      }

      setCompletingTaskId(null);
      fetchTasks();
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Error toggling task:', err);
      setCompletingTaskId(null);
      setMessage({ type: 'error', text: 'Błąd podczas oznaczania zadania' });
      safeSetTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
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

  const dismissTask = async (taskId) => {
    try {
      await axios.post(`/api/tasks/${taskId}/dismiss`);
      setMessage({ type: 'success', text: 'Zadanie odrzucone - nie pojawi się przez 14 dni' });
      fetchTasks();
      safeSetTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
      safeSetTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
      safeSetTimeout(() => setMessage({ type: '', text: '' }), 2000);
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

  // Group tasks by type and time_of_day
  const groupedTasks = useMemo(() => {
    const groups = {};
    const pendingTasks = tasks.filter(t => !t.completed);

    pendingTasks.forEach(task => {
      const timeOfDay = task.time_of_day || 'anytime';
      const key = `${task.task_type}_${timeOfDay}`;

      if (!groups[key]) {
        groups[key] = {
          key,
          type: task.task_type,
          timeOfDay,
          tasks: [],
          plots: new Set(),
        };
      }

      groups[key].tasks.push(task);
      if (task.plot_name) {
        groups[key].plots.add(task.plot_name);
      }
    });

    // Sort groups: water first, then spray, harvest, custom
    const typeOrder = { water: 0, spray: 1, harvest: 2, custom: 3 };
    const timeOrder = { morning: 0, anytime: 1, evening: 2 };

    return Object.values(groups).sort((a, b) => {
      const typeCompare = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      if (typeCompare !== 0) return typeCompare;
      return (timeOrder[a.timeOfDay] || 99) - (timeOrder[b.timeOfDay] || 99);
    });
  }, [tasks]);

  // Toggle group expansion
  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Complete all tasks in a group
  const completeAllInGroup = async (group) => {
    const pendingTasks = group.tasks.filter(t => !t.completed);
    if (pendingTasks.length === 0) return;

    try {
      setMessage({ type: 'success', text: `Wykonuję ${pendingTasks.length} zadań...` });

      for (const task of pendingTasks) {
        await axios.post(`/api/tasks/${task.id}/complete`);
      }

      setMessage({
        type: 'success',
        text: `🎉 Wykonano ${pendingTasks.length} ${declination(pendingTasks.length, 'zadanie', 'zadania', 'zadań')}!`
      });
      safeSetTimeout(() => setMessage({ type: '', text: '' }), 3000);
      fetchTasks();
    } catch (err) {
      console.error('Error completing group:', err);
      setMessage({ type: 'error', text: 'Błąd podczas wykonywania zadań' });
      safeSetTimeout(() => setMessage({ type: '', text: '' }), 3000);
      fetchTasks();
    }
  };

  // Check if we should show grouped view (only for today/pending, not completed)
  const showGroupedView = filter === 'today' && groupedTasks.length > 0;

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
      <div className="max-h-[500px] overflow-y-auto">
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
        ) : showGroupedView ? (
          /* Zgrupowany widok dla "Dzisiaj" */
          <div className="p-3 space-y-3">
            {groupedTasks.map((group) => {
              const colors = getTypeColors(group.type);
              const timeLabel = getTimeLabel(group.timeOfDay);
              const pendingCount = group.tasks.filter(t => !t.completed).length;
              const isExpanded = expandedGroups[group.key];

              return (
                <div
                  key={group.key}
                  className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all`}
                >
                  {/* Nagłówek grupy - klikalny */}
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{colors.icon}</span>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {getTypeLabel(group.type)}
                          </span>
                          {timeLabel.text && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              {timeLabel.icon} {timeLabel.text}
                            </span>
                          )}
                        </div>
                        {group.plots.size > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {Array.from(group.plots).slice(0, 3).join(', ')}
                            {group.plots.size > 3 && ` +${group.plots.size - 3}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.badge}`}>
                        {pendingCount} {declination(pendingCount, 'zadanie', 'zadania', 'zadań')}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-lg transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Rozwinięta lista zadań */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {/* Przycisk "Wykonaj wszystkie" */}
                      {pendingCount > 1 && (
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => completeAllInGroup(group)}
                            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <span>✓</span>
                            Wykonaj wszystkie ({pendingCount})
                          </button>
                        </div>
                      )}

                      {/* Pojedyncze zadania w grupie */}
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {group.tasks.map((task) => {
                          const priorityInfo = getPriorityLabel(task.priority);
                          const overdue = isOverdue(task.due_date) && !task.completed;

                          return (
                            <div
                              key={task.id}
                              className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                overdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                              } ${completingTaskId === task.id ? 'animate-pulse bg-green-50 dark:bg-green-900/20' : ''}`}
                              onTouchStart={(e) => onTouchStart(e, task.id)}
                              onTouchMove={(e) => onTouchMove(e, task.id)}
                              onTouchEnd={() => onTouchEnd(task.id, task)}
                              style={{
                                transform: swipeState[task.id] ? `translateX(${swipeState[task.id]}px)` : 'translateX(0)',
                                transition: swipeState[task.id] === 0 ? 'transform 0.3s ease-out' : 'none',
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {/* Checkbox */}
                                <button
                                  onClick={() => toggleTaskComplete(task.id, task.completed)}
                                  className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110 ${
                                    task.completed
                                      ? 'bg-green-600 border-green-600 text-white'
                                      : 'border-gray-300 dark:border-gray-600 hover:border-green-600 dark:hover:border-green-500 bg-white dark:bg-gray-700'
                                  }`}
                                  aria-label={task.completed ? 'Oznacz jako niewykonane' : 'Oznacz jako wykonane'}
                                >
                                  {task.completed && <span className="text-sm">✓</span>}
                                </button>

                                {/* Treść */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-medium text-gray-900 dark:text-white ${
                                      task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                                    }`}>
                                      {task.description}
                                    </span>
                                    {task.plot_name && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                        {task.plot_name}
                                      </span>
                                    )}
                                    {overdue && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">
                                        Zaległe
                                      </span>
                                    )}
                                  </div>
                                  {task.plant_name && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      🌱 {task.plant_name}
                                    </p>
                                  )}
                                </div>

                                {/* Akcje */}
                                <div className="flex items-center gap-1">
                                  {!task.completed && (
                                    <button
                                      onClick={() => toggleTaskComplete(task.id, false)}
                                      className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                                    >
                                      ✓
                                    </button>
                                  )}
                                  {task.auto_generated && !task.completed && (
                                    <button
                                      onClick={() => snoozeTask(task.id, 1)}
                                      className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                                      title="Przypomnij jutro"
                                    >
                                      ⏰
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Klasyczna lista (dla "Wszystkie" i "Ukończone") */
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((task) => {
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
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all relative overflow-hidden ${
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
                    aria-label={task.completed ? "Oznacz jako niewykonane" : "Oznacz jako wykonane"}
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
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                          ✨ Auto
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full ${priorityInfo.color}`}>
                        {priorityInfo.text}
                      </span>

                      {task.plot_name && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          📍 {task.plot_name}
                        </span>
                      )}

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
                      onClick={() => setDeleteConfirm(task.id)}
                      className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
                      aria-label="Usuń zadanie"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Upcoming Harvests - Collapsible Section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setHarvestsExpanded(!harvestsExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="font-medium text-gray-800 dark:text-white">Nadchodzące zbiory</span>
            {!harvestsLoading && harvests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200">
                {harvests.length}
              </span>
            )}
          </div>
          {harvestsExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
        </button>

        {harvestsExpanded && (
          <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {harvestsLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
              </div>
            ) : harvests.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                Brak nadchodzących zbiorów w ciągu 30 dni
              </div>
            ) : (
              harvests.map((harvest) => (
                <Link
                  key={harvest.id}
                  to={`/plots/${harvest.plot_id}`}
                  className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-white text-sm truncate">
                          {harvest.plant_name}
                        </span>
                        {harvest.plant_variety && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({harvest.plant_variety})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {harvest.plot_name} • Grządka {harvest.row_number}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      harvest.harvest_status === 'ready'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : harvest.harvest_status === 'overdue'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {harvest.harvest_status === 'ready'
                        ? 'Gotowy!'
                        : harvest.harvest_status === 'overdue'
                          ? `Spóźniony ${Math.abs(harvest.days_until_harvest)}d`
                          : `Za ${harvest.days_until_harvest}d`}
                    </span>
                  </div>
                </Link>
              ))
            )}
            {harvests.length > 0 && (
              <Link
                to="/plots"
                className="block px-4 py-2 text-center text-sm text-orange-600 dark:text-orange-400 hover:underline"
              >
                Zobacz wszystkie zbiory →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Garden Plans - Collapsible Section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setGardenPlansExpanded(!gardenPlansExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Grid3X3 size={20} className="text-teal-600 dark:text-teal-400" />
            <span className="font-medium text-gray-800 dark:text-white">Plany nasadzeń</span>
            {!gardenPlansLoading && gardenPlans.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200">
                {gardenPlans.length}
              </span>
            )}
          </div>
          {gardenPlansExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
        </button>

        {gardenPlansExpanded && (
          <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {gardenPlansLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto"></div>
              </div>
            ) : gardenPlans.length === 0 ? (
              <div className="p-4 text-center">
                <Grid3X3 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Brak aktywnych planów nasadzeń</p>
                <Link to="/garden-planner" className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
                  Utwórz plan
                </Link>
              </div>
            ) : (
              gardenPlans.map((plan) => (
                <Link
                  key={plan.id}
                  to="/garden-planner"
                  className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-white text-sm truncate">
                          {plan.name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          plan.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {plan.status === 'active' ? 'Aktywny' : 'Szkic'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{plan.items_count} roślin</span>
                        {plan.plot_name && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span>{plan.plot_name}</span>
                          </>
                        )}
                        {plan.days_until !== null && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className={plan.days_until < 0 ? 'text-red-500' : plan.days_until === 0 ? 'text-green-500' : ''}>
                              {plan.days_until === 0 ? 'Dziś' : plan.days_until === 1 ? 'Jutro' : plan.days_until < 0 ? `${Math.abs(plan.days_until)} dni temu` : `Za ${plan.days_until} dni`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
            {gardenPlans.length > 0 && (
              <Link
                to="/garden-planner"
                className="block px-4 py-2 text-center text-sm text-teal-600 dark:text-teal-400 hover:underline"
              >
                Wszystkie plany →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Upcoming Plans - Collapsible Section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setPlansExpanded(!plansExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-800 dark:text-white">Nadchodzące plany</span>
            {!plansLoading && plans.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200">
                {plans.length}
              </span>
            )}
          </div>
          {plansExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
        </button>

        {plansExpanded && (
          <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {plansLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : plans.length === 0 ? (
              <div className="p-4 text-center">
                <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Brak zaplanowanych działań</p>
                <Link to="/planner" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                  Dodaj pierwszy plan
                </Link>
              </div>
            ) : (
              plans.map((plan) => {
                const isToday = plan.days_until === 0;
                const isOverdue = plan.days_until < 0;
                const ACTION_ICONS = {
                  plant: '🌱', spray: '🧴', water: '💧', harvest: '🥕',
                  transplant: '🔄', fertilize: '🧪', prune: '✂️', custom: '📝'
                };

                return (
                  <div
                    key={plan.id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span>{ACTION_ICONS[plan.action_type] || '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-white text-sm truncate">
                            {plan.title}
                          </span>
                          {plan.weather_dependent && <Cloud size={12} className="text-blue-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 dark:text-red-400 font-medium'
                              : isToday ? 'text-green-600 dark:text-green-400 font-medium'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {isOverdue && <AlertTriangle size={10} />}
                            {plan.days_until === 0 ? 'Dziś' : plan.days_until === 1 ? 'Jutro' : `Za ${plan.days_until} dni`}
                          </span>
                          {plan.plot_name && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-gray-500 dark:text-gray-400 truncate">{plan.plot_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCompletePlan(plan.id); }}
                        className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex-shrink-0"
                        title="Oznacz jako wykonane"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {plans.length > 0 && (
              <Link
                to="/planner"
                className="block px-4 py-2 text-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Wszystkie plany →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {tasks.length > 0 && filter !== 'completed' && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
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
    </div>
  );
};

export default TaskList;
