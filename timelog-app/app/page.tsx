'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Task = {
  id: number;
  name: string;
  createdAt: Date;
};

type TimeEntry = {
  id: number;
  taskId: number;
  duration: number;
  timestamp: Date;
};

export default function Home() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Load saved entries, tasks, and timer state from localStorage on component mount
  useEffect(() => {
    // Load time entries
    const savedEntries = localStorage.getItem('timeEntries');
    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries);
        // Convert string timestamps back to Date objects
        const entriesWithDates = parsedEntries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setTimeEntries(entriesWithDates);
      } catch (error) {
        console.error('Error parsing saved time entries:', error);
      }
    }

    // Load tasks
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // Convert string timestamps back to Date objects
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
        setTasks(tasksWithDates);
      } catch (error) {
        console.error('Error parsing saved tasks:', error);
      }
    }

    // Load timer state
    const savedTimerState = localStorage.getItem('timerState');
    if (savedTimerState) {
      try {
        const { time: savedTime, taskId: savedTaskId, lastUpdated } = JSON.parse(savedTimerState);
        
        // Only restore if the timer was saved less than 1 hour ago
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (lastUpdated > oneHourAgo) {
          setTime(savedTime);
          setSelectedTaskId(savedTaskId);
        } else {
          // Clear outdated timer state
          localStorage.removeItem('timerState');
        }
      } catch (error) {
        console.error('Error parsing saved timer state:', error);
      }
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
  }, [timeEntries]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save timer state whenever it changes
  useEffect(() => {
    // Only save if there's time on the timer
    if (time > 0) {
      localStorage.setItem('timerState', JSON.stringify({
        time,
        taskId: selectedTaskId,
        lastUpdated: Date.now()
      }));
    } else {
      // Clear timer state if timer is reset
      localStorage.removeItem('timerState');
    }
  }, [time, selectedTaskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      const newTask: Task = {
        id: Date.now(),
        name: newTaskName.trim(),
        createdAt: new Date(),
      };
      
      setTasks([...tasks, newTask]);
      setNewTaskName('');
      setShowTaskForm(false);
      
      // Auto-select the newly created task
      setSelectedTaskId(newTask.id);
    }
  };

  const handleDeleteTask = (id: number) => {
    // Remove the task
    setTasks(tasks.filter(task => task.id !== id));
    
    // If the deleted task was selected, clear the selection
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }
    
    // Remove all time entries associated with this task
    setTimeEntries(timeEntries.filter(entry => entry.taskId !== id));
  };

  const handleSaveEntry = () => {
    if (time > 0 && selectedTaskId) {
      const newEntry: TimeEntry = {
        id: Date.now(),
        taskId: selectedTaskId,
        duration: time,
        timestamp: new Date(),
      };
      
      setTimeEntries([newEntry, ...timeEntries]);
      setTime(0);
      setIsRunning(false);
    }
  };

  const handleDeleteEntry = (id: number) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
  };

  const handleExportCSV = () => {
    if (timeEntries.length === 0) return;

    // Create CSV content
    const headers = ['Description', 'Task', 'Duration (HH:MM:SS)', 'Date & Time'];
    const csvRows = [headers.join(',')];

    timeEntries.forEach(entry => {
      const formattedDuration = formatTime(entry.duration);
      const formattedTimestamp = entry.timestamp.toLocaleString();
      
      // Find the task associated with this entry
      const task = tasks.find(t => t.id === entry.taskId);
      const taskName = task ? task.name : 'No Task';
      
      // Escape text fields to handle commas
      const escapedDescription = `"${entry.description.replace(/"/g, '""')}"`;
      const escapedTaskName = `"${taskName.replace(/"/g, '""')}"`;
      
      csvRows.push([
        escapedDescription,
        escapedTaskName,
        formattedDuration,
        formattedTimestamp
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `timelog-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between mb-6">
          <h1 className="text-xl font-bold">Time Tracker</h1>
          <div className="space-x-2">
            <Link href="/tasks" className="text-sm text-blue-500 hover:text-blue-700">
              Tasks
            </Link>
            <Link href="/entries" className="text-sm text-blue-500 hover:text-blue-700">
              Entries
            </Link>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">Timelog App</h1>
        
        <div className="text-6xl font-mono text-center mb-6 text-gray-800 dark:text-white">
          {formatTime(time)}
        </div>
        
        {/* Task Selection */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Task
            </label>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              {showTaskForm ? 'Cancel' : '+ New Task'}
            </button>
          </div>
          
          {showTaskForm ? (
            <div className="flex mb-2">
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Enter task name"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleAddTask}
                disabled={!newTaskName.trim()}
                className={`px-4 py-2 rounded-r-md font-medium text-white ${
                  !newTaskName.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } transition-colors`}
              >
                Add
              </button>
            </div>
          ) : (
            <select
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- No task selected --</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          )}
          
          {tasks.length > 0 && !showTaskForm && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} available
            </div>
          )}
        </div>
        
        
        
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={handleStartPause}
            className={`px-6 py-3 rounded-lg font-medium text-white ${
              isRunning 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-green-500 hover:bg-green-600'
            } transition-colors`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Reset
          </button>
          
          <button
            onClick={handleSaveEntry}
            disabled={time === 0 || !selectedTaskId}
            className={`px-6 py-3 rounded-lg font-medium text-white ${
              time === 0 || !selectedTaskId
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
          >
            Save
          </button>
        </div>
        
        {/* Task Management Section */}
{tasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Your Tasks</h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`task-${task.id}`}
                      name="selectedTask"
                      checked={selectedTaskId === task.id}
                      onChange={() => setSelectedTaskId(task.id)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <label htmlFor={`task-${task.id}`} className="font-medium text-gray-800 dark:text-white cursor-pointer">
                      {task.name}
                    </label>
                  </div>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

{/* Time Entries Section */}
{timeEntries.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Time Entries</h2>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-3">
              {timeEntries.map((entry) => {
                // Find the task associated with this entry
                const task = tasks.find(t => t.id === entry.taskId);
                
                return (
                  <div 
                    key={entry.id} 
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{entry.description}</p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatTime(entry.duration)}</span>
                        <span className="mx-1">•</span>
                        {task && (
                          <>
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded text-xs">
                              {task.name}
                            </span>
                            <span className="mx-1">•</span>
                          </>
                        )}
                        <span>{entry.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
