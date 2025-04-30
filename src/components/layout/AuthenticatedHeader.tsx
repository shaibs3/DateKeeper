"use client";

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { FiCalendar, FiBell, FiSettings, FiMoon } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';

export function AuthenticatedHeader() {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsOpen]);

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <div className="text-2xl text-blue-500"><FiCalendar /></div>
        <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Datekeeper</span>
      </div>
      <nav className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/home')} className="text-blue-600 bg-blue-100 px-3 py-1 rounded-lg flex items-center gap-1 font-semibold"><FiCalendar className="text-lg" /> Dashboard</button>
          <button onClick={() => router.push('/reminders')} className="text-gray-500 hover:text-blue-600"><FiBell className="text-xl" /></button>
          <div className="relative" ref={settingsRef}>
            <button
              className="text-gray-500 hover:text-blue-600 focus:outline-none"
              onClick={() => setSettingsOpen((open) => !open)}
            >
              <FiSettings className="text-xl" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { setSettingsOpen(false); router.push('/settings'); }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  General Settings
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg border-t border-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
          <button className="text-gray-500 hover:text-blue-600"><FiMoon className="text-xl" /></button>
        </div>
      </nav>
    </header>
  );
} 