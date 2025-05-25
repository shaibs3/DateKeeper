'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiSettings, FiMoon, FiDownload, FiUpload, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader';

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState('blue');

  if (status === 'loading') return null;
  if (status === 'unauthenticated') {
    router.replace('/');
    return null;
  }

  const colorOptions = [
    { name: 'blue', color: 'bg-blue-500' },
    { name: 'pink', color: 'bg-pink-400' },
    { name: 'green', color: 'bg-green-500' },
    { name: 'purple', color: 'bg-purple-500' },
    { name: 'orange', color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-[#f6fcfb]">
      <AuthenticatedHeader />
      <main className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-8">
          <FiSettings className="text-blue-500" /> Settings
        </h1>

        {/* Appearance Section */}
        <section className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b px-8 py-6">
            <h2 className="text-lg font-semibold mb-2">Appearance</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold">Dark Mode</div>
                <div className="text-gray-600 text-sm">Switch between light and dark theme</div>
              </div>
              <button className="bg-gray-100 p-2 rounded-lg text-xl text-gray-700 hover:bg-gray-200">
                <FiMoon />
              </button>
            </div>
            <div>
              <div className="font-semibold mb-1">Default Color Scheme</div>
              <div className="text-gray-600 text-sm mb-2">Choose your preferred color for new dates</div>
              <div className="flex gap-4 mt-2">
                {colorOptions.map(opt => (
                  <button
                    key={opt.name}
                    onClick={() => setSelectedColor(opt.name)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${opt.color} ${selectedColor === opt.name ? 'border-blue-700 ring-2 ring-blue-300' : 'border-white'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="bg-white rounded-2xl shadow-lg">
          <div className="px-8 py-6">
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Export Your Data</div>
                  <div className="text-gray-600 text-sm">Download a backup of all your dates and settings</div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                  <FiDownload /> Export
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Clear All Data</div>
                  <div className="text-gray-600 text-sm">Delete all your dates and reset preferences</div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
                  <FiTrash2 /> Clear Data
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 