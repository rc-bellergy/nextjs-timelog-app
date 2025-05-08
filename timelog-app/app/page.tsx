'use client';

import { useState, useEffect } from 'react';

type TimeEntry = {
  id: number;
  description: string;
  duration: number;
  timestamp: Date;
};

export default function Home() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [description, setDescription] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // Load saved entries and timer state from localStorage on component mount
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

    // Load timer state
    const savedTimerState = localStorage.getItem('timerState');
    if (savedTimerState) {
      try {
        const { time: savedTime, description: savedDescription, lastUpdated } = JSON.parse(savedTimerState);
        
        // Only restore if the timer was saved less than 1 hour ago
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (lastUpdated > oneHourAgo) {
          setTime(savedTime);
          setDescription(savedDescription || '');
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

  // Save timer state whenever it changes
  useEffect(() => {
    // Only save if there's time on the timer
    if (time > 0) {
      localStorage.setItem('timerState', JSON.stringify({
        time,
        description,
        lastUpdated: Date.now()
      }));
    } else {
      // Clear timer state if timer is reset
      localStorage.removeItem('timerState');
    }
  }, [time, description]);

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

  const handleSaveEntry = () => {
    if (time > 0) {
      const newEntry: TimeEntry = {
        id: Date.now(),
        description: description || 'Untitled entry',
        duration: time,
        timestamp: new Date(),
      };
      
      setTimeEntries([newEntry, ...timeEntries]);
      setDescription('');
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
    const headers = ['Description', 'Duration (HH:MM:SS)', 'Date & Time'];
    const csvRows = [headers.join(',')];

    timeEntries.forEach(entry => {
      const formattedDuration = formatTime(entry.duration);
      const formattedTimestamp = entry.timestamp.toLocaleString();
      // Escape description to handle commas in the text
      const escapedDescription = `"${entry.description.replace(/"/g, '""')}"`;
      
      csvRows.push([
        escapedDescription,
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
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">Timelog App</h1>
        
        <div className="text-6xl font-mono text-center mb-6 text-gray-800 dark:text-white">
          {formatTime(time)}
        </div>
        
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What are you working on?
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
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
            disabled={time === 0}
            className={`px-6 py-3 rounded-lg font-medium text-white ${
              time === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
          >
            Save
          </button>
        </div>
        
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
              {timeEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{entry.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(entry.duration)} • {entry.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
