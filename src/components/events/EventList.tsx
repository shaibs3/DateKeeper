'use client';

import { EventCard } from './EventCard';
import { Event } from './EventCard';

interface EventListProps {
  events: Event[];
  onDelete: (id: string) => void;
}

export function EventList({ events, onDelete }: EventListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event} 
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 