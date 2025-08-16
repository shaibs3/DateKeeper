import { format, isToday, isTomorrow } from 'date-fns';
import { useState } from 'react';

export type Event = {
  id: string;
  name: string;
  date: Date;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'OTHER';
};

type EventCardProps = {
  event: Event;
  onDelete: (id: string) => void;
};

export function EventCard({ event, onDelete }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const today = new Date();
  const nextOccurrence = new Date(event.date);
  nextOccurrence.setFullYear(today.getFullYear());
  if (nextOccurrence < today) {
    nextOccurrence.setFullYear(today.getFullYear() + 1);
  }
  const daysUntil = Math.ceil((nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const getBadgeClass = () => {
    switch (event.type) {
      case 'BIRTHDAY':
        return 'badge-birthday';
      case 'ANNIVERSARY':
        return 'badge-anniversary';
      default:
        return 'badge-other';
    }
  };

  const getDaysText = () => {
    if (isToday(nextOccurrence)) return 'Today!';
    if (isTomorrow(nextOccurrence)) return 'Tomorrow';
    return `${daysUntil} days`;
  };

  return (
    <div
      data-testid="event-card"
      className="card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{format(event.date, 'MMMM d, yyyy')}</p>
        </div>
        <span className={`badge ${getBadgeClass()}`}>{event.type.toLowerCase()}</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {getDaysText()} until next occurrence
        </span>
        {isHovered && (
          <button
            onClick={() => onDelete(event.id)}
            className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
