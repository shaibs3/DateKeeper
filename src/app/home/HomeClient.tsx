'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiGift } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader';
import { AddDateModal } from '@/components/events/AddDateModal';
import { DateList } from '@/components/events/DateList';
import Select, { MultiValue } from 'react-select';
import type { DateEvent } from '@/components/events/DateList';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthOptions = MONTHS.map((month, idx) => ({ value: idx, label: month }));

export default function HomeClient() {
  const { status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<DateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<{ value: number; label: string }[]>([]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status]);

  const handleEventUpdated = () => {
    fetchEvents();
  };

  // Filter events by selected months
  const filteredEvents = selectedMonths.length === 0
    ? events
    : events.filter((event: DateEvent) => selectedMonths.some(m => m.value === new Date(event.date).getMonth()));

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#f6fcfb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6fcfb]">
      <AuthenticatedHeader />
      <AddDateModal 
        open={addModalOpen} 
        onClose={() => {
          setAddModalOpen(false);
          handleEventUpdated();
        }} 
      />
      <main className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Important Dates</h1>
          <div className="flex gap-2 items-center">
            <div className="min-w-[220px]">
              <Select
                isMulti
                options={monthOptions}
                value={selectedMonths}
                onChange={(newValue: MultiValue<{ value: number; label: string }>) => setSelectedMonths(Array.isArray(newValue) ? [...newValue] : [])}
                placeholder="Filter by month..."
                classNamePrefix="react-select"
              />
            </div>
            <button
              className="ml-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
              onClick={() => setAddModalOpen(true)}
            >
              + Add Date
            </button>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center py-20">
            <div className="bg-blue-100 rounded-full p-4 mb-6">
              <FiGift className="text-blue-500 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No dates added yet</h2>
            <p className="text-gray-600 mb-6">Start adding important dates to never miss a special occasion again.</p>
            <button
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
              onClick={() => setAddModalOpen(true)}
            >
              + Add Your First Date
            </button>
          </div>
        ) : (
          <DateList events={filteredEvents} onEventDeleted={handleEventUpdated} />
        )}
      </main>
    </div>
  );
} 