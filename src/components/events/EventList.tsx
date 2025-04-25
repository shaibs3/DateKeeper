import { EventCard, Event } from './EventCard';

interface EventListProps {
  events: Event[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function EventList({ events, onEdit, onDelete }: EventListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 