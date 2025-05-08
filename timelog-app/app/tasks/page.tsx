'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Task = {
  id: number;
  name: string;
  createdAt: Date;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  const handleDeleteTask = (id: number) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          Back to Timer
        </Link>
      </div>
      
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
            <span>{task.name}</span>
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
  );
}