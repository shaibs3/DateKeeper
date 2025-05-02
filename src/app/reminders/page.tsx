'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiBell } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader';

export default function RemindersPage() {
  const { status } = useSession();
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

  if (status === 'loading') {
    return null;
  }
  if (status === 'unauthenticated') {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6fcfb]">
      <AuthenticatedHeader />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-8"><FiBell className="text-blue-500" /> Reminder Settings</h1>

        {/* Default Reminder Settings */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold mb-2">Default Reminder Settings</h2>
          <p className="text-gray-600 mb-4">Set when you&apos;d like to be reminded about upcoming dates by default. These settings will be applied to new dates you add.</p>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 font-semibold">On the day</button>
            <button className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 font-semibold">1 day before</button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold">3 days before</button>
            <button className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 font-semibold">7 days before</button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold">14 days before</button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold">30 days before</button>
          </div>
        </section>

        {/* Notification Schedule */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-blue-500"><FiCalendar /></span> Notification Schedule</h2>
          <p className="text-gray-600 mb-4">Notifications are sent as browser notifications at the following times:</p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-blue-50 rounded-lg p-4">
              <FiCalendar className="text-blue-500 text-2xl" />
              <div>
                <div className="font-semibold">Same day notification</div>
                <div className="text-gray-600 text-sm">Sent at 9:00 AM on the day of the event</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-blue-50 rounded-lg p-4">
              <FiCalendar className="text-blue-500 text-2xl" />
              <div>
                <div className="font-semibold">Day before notification</div>
                <div className="text-gray-600 text-sm">Sent at 12:00 PM the day before the event</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-blue-50 rounded-lg p-4">
              <FiCalendar className="text-blue-500 text-2xl" />
              <div>
                <div className="font-semibold">Week before notification</div>
                <div className="text-gray-600 text-sm">Sent at 12:00 PM one week before the event</div>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
            <span className="font-semibold">Note:</span> Notifications will only appear when the app is open in your browser. Make sure to keep the app open or bookmark it for regular checks.
          </div>
        </section>
      </main>
    </div>
  );
} 