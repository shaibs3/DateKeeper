'use client';

import { useState } from 'react';
import { FiGift, FiCalendar, FiMoreVertical, FiEdit2, FiTrash2, FiHeart } from 'react-icons/fi';
import { FaBirthdayCake } from 'react-icons/fa';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AddDateModal } from '@/components/events/AddDateModal';
import { toast } from 'react-hot-toast';

export interface DateEvent {
  id: string;
  name: string;
  date: string;
  category: string;
  color: string;
  recurrence: string;
  notes?: string;
  reminders: string[];
  originalDate?: string;
}

function getEventIcon(category: string) {
  switch (category) {
    case 'Birthday':
      return <span className="bg-blue-100 rounded-full p-2"><FaBirthdayCake className="text-blue-500" /></span>;
    case 'Anniversary':
      return <span className="bg-blue-100 rounded-full p-2"><FiHeart className="text-blue-500" /></span>;
    case 'Holiday':
      return <span className="bg-blue-100 rounded-full p-2"><FiGift className="text-blue-500" /></span>;
    default:
      return <span className="bg-blue-100 rounded-full p-2"><FiCalendar className="text-blue-500" /></span>;
  }
}

export function DateList({ events, originalEvents, onEventDeleted }: { events: DateEvent[], originalEvents: DateEvent[], onEventDeleted: () => void }) {
  const [selectedEvent, setSelectedEvent] = useState<DateEvent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Event deleted successfully!');
        onEventDeleted();
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      toast.error('Failed to delete event');
    }
    setShowDeleteConfirm(false);
  };

  // Group events by month
  const eventsByMonth: { [month: number]: DateEvent[] } = {};
  events.forEach(event => {
    const month = new Date(event.date).getMonth();
    if (!eventsByMonth[month]) eventsByMonth[month] = [];
    eventsByMonth[month].push(event);
  });
  // Sort events within each month by date ascending
  Object.keys(eventsByMonth).forEach(monthIdxStr => {
    const monthIdx = Number(monthIdxStr);
    eventsByMonth[monthIdx] = eventsByMonth[monthIdx].sort((a: DateEvent, b: DateEvent) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = new Date().getMonth();

  // Compute ordered months: current, then next, wrapping around
  const orderedMonths = [
    ...Array.from({ length: 12 }, (_, i) => (currentMonth + i) % 12)
  ];

  const EventCard = ({ event }: { event: DateEvent }) => {
    const eventDate = new Date(event.date);
    const isToday = new Date().toDateString() === eventDate.toDateString();
    // For birthdays, calculate the age they will turn on this occurrence
    let birthdayAge: number | null = null;
    if (event.category === 'Birthday') {
      const birthDate = new Date(event.originalDate || event.date);
      birthdayAge = eventDate.getFullYear() - birthDate.getFullYear();
      if (birthdayAge < 0) birthdayAge = 0;
    }

    // Helper to prevent click propagation from menu button
    const handleMenuButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMenuId(openMenuId === event.id ? null : event.id);
    };

    return (
      <div
        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
        onClick={() => {
          // Always use the original event (with the real DB ID) for editing
          const realEvent = originalEvents.find(e => e.id === (event.id.split('-')[0]));
          setSelectedEvent(realEvent || event);
          setShowEditModal(true);
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center">
            {getEventIcon(event.category)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{event.name}</h3>
            <div className="text-sm text-gray-500">
              {eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            {event.category === 'Birthday' && (
              <div className="text-sm text-gray-600">
                Turning {birthdayAge} years old
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isToday && (
            <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs font-semibold rounded">
              TODAY!
            </span>
          )}
          <div className="relative">
            <button 
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={handleMenuButtonClick}
            >
              <FiMoreVertical />
            </button>
            {openMenuId === event.id && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                <button
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    const realEvent = originalEvents.find(e => e.id === (event.id.split('-')[0]));
                    setSelectedEvent(realEvent || event);
                    setShowEditModal(true);
                    setOpenMenuId(null);
                  }}
                >
                  <FiEdit2 className="text-gray-400" />
                  Edit
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowDeleteConfirm(true);
                    setOpenMenuId(null);
                  }}
                >
                  <FiTrash2 className="text-red-400" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-8">
        {/* Coming Up Soon: current month */}
        {eventsByMonth[currentMonth] && eventsByMonth[currentMonth].length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Up Soon</h2>
            <div className="space-y-3">
              {eventsByMonth[currentMonth].map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
        {/* Other months in calendar order after current */}
        {orderedMonths
          .filter(monthIdx => monthIdx !== currentMonth && eventsByMonth[monthIdx] && eventsByMonth[monthIdx].length > 0)
          .map(monthIdx => (
            <section key={monthIdx}>
              <h2 className="text-xl font-semibold text-blue-700 mb-4">{MONTHS[monthIdx]}</h2>
              <div className="space-y-3">
                {eventsByMonth[monthIdx].map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />

      {selectedEvent && (
        <AddDateModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onSaved={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
            onEventDeleted();
          }}
        />
      )}
    </>
  );
} 