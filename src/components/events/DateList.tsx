'use client';

import { useState } from 'react';
import { FiGift, FiCalendar, FiMoreVertical, FiEdit2, FiTrash2, FiHeart } from 'react-icons/fi';
import { FaBirthdayCake } from 'react-icons/fa';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AddDateModal } from '@/components/events/AddDateModal';
import { toast } from 'react-hot-toast';

interface DateEvent {
  id: string;
  name: string;
  date: string;
  category: string;
  color: string;
  recurrence: string;
  notes?: string;
  reminders: string[];
}

function calculateAge(birthDate: Date, eventDate: Date): number {
  let age = eventDate.getFullYear() - birthDate.getFullYear();
  const m = eventDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && eventDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
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

export function DateList({ events, onEventDeleted }: { events: DateEvent[], onEventDeleted: () => void }) {
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

  const now = new Date();
  const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
  
  const upcomingEvents = events
    .filter(event => new Date(event.date) <= threeMonthsFromNow)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const laterEvents = events
    .filter(event => new Date(event.date) > threeMonthsFromNow)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const EventCard = ({ event }: { event: DateEvent }) => {
    const eventDate = new Date(event.date);
    const isToday = new Date().toDateString() === eventDate.toDateString();
    
    // Helper to prevent click propagation from menu button
    const handleMenuButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMenuId(openMenuId === event.id ? null : event.id);
    };

    return (
      <div
        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
        onClick={() => {
          setSelectedEvent(event);
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
            <div className="text-sm text-gray-600">
              Turning {calculateAge(new Date(event.date), eventDate)} years old
            </div>
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
                    setSelectedEvent(event);
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
        {upcomingEvents.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Up Soon</h2>
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
        
        {laterEvents.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Later This Year</h2>
            <div className="space-y-3">
              {laterEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
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