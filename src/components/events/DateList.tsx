'use client';

import { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
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

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today!';
  if (diffDays === 1) return 'Tomorrow!';
  if (diffDays < 30) return `In ${diffDays} days`;
  
  const diffMonths = Math.ceil(diffDays / 30);
  if (diffMonths === 1) return 'In 1 month';
  if (diffMonths < 12) return `In ${diffMonths} months`;
  
  return date.toLocaleDateString();
}

function calculateAge(birthDate: Date, eventDate: Date): number {
  let age = eventDate.getFullYear() - birthDate.getFullYear();
  const m = eventDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && eventDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function DateList({ events, onEventDeleted }: { events: DateEvent[], onEventDeleted: () => void }) {
  const [selectedEvent, setSelectedEvent] = useState<DateEvent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // const menuRef = useRef<HTMLDivElement>(null);

  // Temporarily remove click outside logic for debugging
  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
  //       setOpenMenuId(null);
  //     }
  //   }
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, []);

  const handleDelete = async () => {
    if (!selectedEvent) return;
    console.log('Deleting event:', selectedEvent.id);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
      });
      console.log('Delete response:', response.status);
      if (response.ok) {
        toast.success('Event deleted successfully!');
        onEventDeleted();
      } else {
        const error = await response.json();
        console.error('Delete error:', error);
        toast.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
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
    
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.color === 'blue' ? 'bg-blue-100' : 'bg-pink-100'}`}>
            <FiCalendar className={`text-xl ${event.color === 'blue' ? 'text-blue-500' : 'text-pink-500'}`} />
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
              onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
            >
              <FiMoreVertical />
            </button>
            {openMenuId === event.id && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                <button
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    console.log('Edit clicked', event);
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
                    console.log('Delete clicked', event);
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