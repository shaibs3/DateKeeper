'use client';

import { useState } from 'react';

type EventType = 'BIRTHDAY' | 'ANNIVERSARY' | 'OTHER';

interface AddEventFormProps {
  onSubmit: (event: { name: string; date: Date; type: EventType }) => void;
}

export function AddEventForm({ onSubmit }: AddEventFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    date: string;
    type: EventType;
  }>({
    name: '',
    date: '',
    type: 'BIRTHDAY',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const eventData = {
      name: formData.get('name') as string,
      date: new Date(formData.get('date') as string),
      type: formData.get('type') as EventType,
    };
    onSubmit(eventData);
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="Enter name"
            required
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Event Type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={e => {
              const value = e.target.value as EventType;
              setFormData({ ...formData, type: value });
            }}
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
      </div>
    </form>
  );
}
