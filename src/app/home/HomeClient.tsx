'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiGift } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { AuthenticatedHeader } from '@/components/layout/AuthenticatedHeader';
import { AddDateModal } from '@/components/events/AddDateModal';
import { DateList } from '@/components/events/DateList';
import Select, { MultiValue } from 'react-select';
import { clientLogger } from '@/lib/clientLogger';
import type { DateEvent } from '@/components/events/DateList';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const monthOptions = MONTHS.map((month, idx) => ({ value: idx, label: month }));

export default function HomeClient() {
  const { status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<DateEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<{ value: number; label: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('All');

  // Extract years from events and add next 5 years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const yearOptions = [
    { value: 'All', label: 'All' },
    ...years.map(y => ({ value: String(y), label: String(y) })),
  ];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      clientLogger.error('Failed to fetch events', error);
      setEvents([]);
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

  // Filter events by selected year and months
  let filteredEvents: DateEvent[] = [];
  if (selectedYear === 'All') {
    // Duplicate monthly events for every month
    filteredEvents = events.flatMap(event => {
      if (event.recurrence === 'Monthly') {
        // Add a copy of the event to every month, always using the last valid day if needed
        return Array.from({ length: 12 }, (_, m) => {
          const origDate = new Date(event.date);
          const year = new Date().getFullYear();
          const daysInMonth = new Date(year, m + 1, 0).getDate();
          const day = Math.min(origDate.getDate(), daysInMonth);
          const adjustedDate = new Date(origDate);
          adjustedDate.setFullYear(year);
          adjustedDate.setMonth(m);
          adjustedDate.setDate(day);
          return {
            ...event,
            date: adjustedDate.toISOString(),
            id: event.id + '-y' + year + '-m' + m,
            originalDate: event.date,
          };
        });
      } else if (event.recurrence === 'Yearly') {
        // Show the next occurrence (this year or next year if already passed)
        const origDate = new Date(event.date);
        const today = new Date();
        let year = today.getFullYear();
        let nextOccurrence = new Date(origDate);
        nextOccurrence.setFullYear(year);
        if (
          today.getMonth() > origDate.getMonth() ||
          (today.getMonth() === origDate.getMonth() && today.getDate() > origDate.getDate())
        ) {
          year++;
          nextOccurrence = new Date(origDate);
          nextOccurrence.setFullYear(year);
        }
        return [
          {
            ...event,
            date: nextOccurrence.toISOString(),
            id: event.id + '-y' + year,
            originalDate: event.date,
          },
        ];
      } else {
        const eventMonth = new Date(event.date).getMonth();
        const monthMatch =
          selectedMonths.length === 0 || selectedMonths.some(m => m.value === eventMonth);
        return monthMatch ? [{ ...event, originalDate: event.date }] : [];
      }
    });
    // Filter by selected months if any
    if (selectedMonths.length > 0) {
      filteredEvents = filteredEvents.filter(event =>
        selectedMonths.some(m => m.value === new Date(event.date).getMonth())
      );
    }
    // Filter to only events in the current year
    filteredEvents = filteredEvents.filter(
      event => new Date(event.date).getFullYear() === currentYear
    );
  } else {
    const yearNum = Number(selectedYear);
    filteredEvents = events.flatMap(event => {
      if (event.recurrence === 'Yearly') {
        // Clone the event and set its date to the selected year
        const origDate = new Date(event.date);
        const adjustedDate = new Date(origDate);
        adjustedDate.setFullYear(yearNum);
        const eventMonth = adjustedDate.getMonth();
        const monthMatch =
          selectedMonths.length === 0 || selectedMonths.some(m => m.value === eventMonth);
        if (monthMatch) {
          return [{ ...event, date: adjustedDate.toISOString(), originalDate: event.date }];
        }
        return [];
      } else if (event.recurrence === 'Monthly') {
        // Add a copy of the event to every month in the selected year, always using the last valid day if needed
        return Array.from({ length: 12 }, (_, m) => {
          const origDate = new Date(event.date);
          const daysInMonth = new Date(yearNum, m + 1, 0).getDate();
          const day = Math.min(origDate.getDate(), daysInMonth);
          const adjustedDate = new Date(origDate);
          adjustedDate.setFullYear(yearNum);
          adjustedDate.setMonth(m);
          adjustedDate.setDate(day);
          return {
            ...event,
            date: adjustedDate.toISOString(),
            id: event.id + '-y' + yearNum + '-m' + m,
            originalDate: event.date,
          };
        }).filter(event => {
          const eventMonth = new Date(event.date).getMonth();
          return selectedMonths.length === 0 || selectedMonths.some(m => m.value === eventMonth);
        });
      } else {
        const eventYear = new Date(event.date).getFullYear();
        const eventMonth = new Date(event.date).getMonth();
        const yearMatch = eventYear === yearNum;
        const monthMatch =
          selectedMonths.length === 0 || selectedMonths.some(m => m.value === eventMonth);
        return yearMatch && monthMatch ? [{ ...event, originalDate: event.date }] : [];
      }
    });
  }

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
            <div className="min-w-[120px]">
              <Select
                options={yearOptions}
                value={yearOptions.find(opt => opt.value === selectedYear)}
                onChange={opt => setSelectedYear(opt?.value || 'All')}
                isSearchable={false}
                placeholder="Year"
                classNamePrefix="react-select"
              />
            </div>
            <div className="min-w-[220px]">
              <Select
                isMulti
                options={monthOptions}
                value={selectedMonths}
                onChange={(newValue: MultiValue<{ value: number; label: string }>) =>
                  setSelectedMonths(Array.isArray(newValue) ? [...newValue] : [])
                }
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
            <p className="text-gray-600 mb-6">
              Start adding important dates to never miss a special occasion again.
            </p>
            <button
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
              onClick={() => setAddModalOpen(true)}
            >
              + Add Your First Date
            </button>
          </div>
        ) : (
          <DateList
            events={filteredEvents}
            originalEvents={events}
            onEventDeleted={handleEventUpdated}
          />
        )}
      </main>
    </div>
  );
}
