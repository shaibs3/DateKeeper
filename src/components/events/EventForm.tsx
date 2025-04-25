import { useState } from 'react';
import { Event } from './EventCard';

type EventFormProps = {
  onSubmit: (event: Omit<Event, 'id'>) => void;
};

export function EventForm({ onSubmit }: EventFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<Event['type']>('BIRTHDAY');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    onSubmit({
      name,
      date: new Date(date),
      type,
    });

    setName('');
    setDate('');
    setType('BIRTHDAY');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder="Enter name"
          required
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Event Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as Event['type'])}
          className="input-field"
        >
          <option value="BIRTHDAY">Birthday</option>
          <option value="ANNIVERSARY">Anniversary</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <button type="submit" className="btn-primary w-full">
        Add Event
      </button>
    </form>
  );
} 