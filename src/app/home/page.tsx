'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiGift } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader';
import { AddDateModal } from '@/components/events/AddDateModal';
import { DateList } from '@/components/events/DateList';

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const fetchEvents = async () => {
    console.log('Fetching events...');
    try {
      const response = await fetch('/api/events');
      console.log('Events response:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched events:', data);
        setEvents(data);
      } else {
        const error = await response.json();
        console.error('Failed to fetch events:', error);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
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
    console.log('Event updated, refreshing list...');
    fetchEvents();
  };

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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search dates..."
              className="px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              style={{ minWidth: 200 }}
            />
            <button
              className="ml-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
              onClick={() => setAddModalOpen(true)}
            >
              + Add Date
            </button>
          </div>
        </div>

        {events.length === 0 ? (
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
          <DateList events={events} onEventDeleted={handleEventUpdated} />
        )}
      </main>
    </div>
  );
} 