'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EventCard, Event } from '@/components/events/EventCard';
import { EventForm } from '@/components/events/EventForm';

export const dynamic = 'force-dynamic';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetch('/api/events')
        .then(res => res.json())
        .then(data => setEvents(data))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  const handleEventSubmit = (_event: Omit<Event, 'id'>) => {
    // TODO: Add event to database
  };

  const handleEventDelete = (_eventId: string) => {
    // TODO: Delete event from database
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Group events by month
  const eventsByMonth: { [month: number]: any[] } = {};
  events.forEach(event => {
    const month = new Date(event.date).getMonth();
    if (!eventsByMonth[month]) eventsByMonth[month] = [];
    eventsByMonth[month].push(event);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {session?.user?.name}!</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Add Event Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Event</h2>
              <EventForm onSubmit={handleEventSubmit} />
            </div>
          </div>

          {/* Right Column - Events List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Your Events</h2>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  {Object.keys(eventsByMonth).length === 0 && (
                    <div className="text-gray-500">No events found.</div>
                  )}
                  {Object.keys(eventsByMonth)
                    .sort((a, b) => Number(a) - Number(b))
                    .map(monthIdx => (
                      <div key={monthIdx}>
                        <h3 className="text-xl font-semibold text-blue-700 mb-4">{MONTHS[Number(monthIdx)]}</h3>
                        <div className="space-y-4">
                          {eventsByMonth[Number(monthIdx)].map(event => (
                            <EventCard
                              key={event.id}
                              event={{
                                ...event,
                                date: new Date(event.date),
                                type: event.category?.toUpperCase() || 'OTHER',
                              }}
                              onDelete={handleEventDelete}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 