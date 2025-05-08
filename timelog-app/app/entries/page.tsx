'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';

type TimeEntry = {
  id: number;
  taskId: number;
  duration: number;
  timestamp: Date;
};

type Task = {
  id: number;
  name: string;
};

export default function EntriesPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const savedEntries = localStorage.getItem('timeEntries');
    const savedTasks = localStorage.getItem('tasks');
    
    if (savedEntries) setTimeEntries(JSON.parse(savedEntries));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  const handleExportCSV = () => {
    if (timeEntries.length === 0) return;

    const headers = ['Task', 'Duration (HH:MM:SS)', 'Date & Time'];
    const csvRows = [headers.join(',')];

    timeEntries.forEach(entry => {
      const task = tasks.find(t => t.id === entry.taskId);
      const taskName = task ? task.name : 'No Task';
      
      csvRows.push([
        `"${taskName.replace(/"/g, '""')}"`,
        formatTime(entry.duration),
        entry.timestamp.toLocaleString()
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-entries-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Time Entries</h1>
        <div className="space-x-4">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export CSV
          </button>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Back to Timer
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {timeEntries.map(entry => {
          const task = tasks.find(t => t.id === entry.taskId);
          return (
            <div key={entry.id} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between">
                <span>{task?.name || 'No Task'}</span>
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
              <div className="mt-2 text-right">
                Duration: {formatTime(entry.duration)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}