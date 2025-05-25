"use client";

import { useState, useEffect } from 'react';
import { FiX, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

interface AddDateModalProps {
  open: boolean;
  onClose: () => void;
  event?: DateEvent;
  onSaved?: () => void;
}

const colorOptions = [
  { name: 'blue', color: 'bg-blue-500' },
  { name: 'pink', color: 'bg-pink-400' },
  { name: 'green', color: 'bg-green-500' },
  { name: 'purple', color: 'bg-purple-500' },
  { name: 'orange', color: 'bg-orange-500' },
];

const reminderOptions = [
  'On day',
  '1 day before',
  '3 days before',
  '7 days before',
  '14 days before',
  '30 days before',
];

const categoryOptions = ['Birthday', 'Anniversary', 'Other'];
const recurrenceOptions = ['Monthly', 'Yearly'];

export function AddDateModal({ open, onClose, event, onSaved }: AddDateModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState(categoryOptions[0]);
  const [color, setColor] = useState('green');
  const [reminders, setReminders] = useState<string[]>(['On day', '1 day before', '7 days before']);
  const [recurrence, setRecurrence] = useState(recurrenceOptions[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      if (event) {
        setName(event.name);
        setDate(event.date.split('T')[0]);
        setCategory(event.category);
        setColor(event.color);
        setReminders(event.reminders);
        setRecurrence(event.recurrence);
        setNotes(event.notes || '');
      } else {
        setName('');
        setDate('');
        setCategory(categoryOptions[0]);
        setColor('green');
        setReminders(['On day', '1 day before', '7 days before']);
        setRecurrence('Yearly');
        setNotes('');
      }
    }
  }, [open, event]);

  if (!open) return null;

  const handleReminderToggle = (reminder: string) => {
    setReminders((prev) =>
      prev.includes(reminder)
        ? prev.filter((r) => r !== reminder)
        : [...prev, reminder]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Force recurrence to 'Yearly' for Birthday and Anniversary
    const finalRecurrence = (category === 'Birthday' || category === 'Anniversary') ? 'Yearly' : recurrence;
    try {
      const url = event ? `/api/events/${event.id}` : '/api/date-event';
      const method = event ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, category, color, recurrence: finalRecurrence, notes, reminders }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save');
      }
      
      toast.success(event ? 'Event updated successfully!' : 'Date saved successfully!');
      onClose();
      if (onSaved) onSaved();
      router.refresh();
    } catch (err) {
      toast.error(event ? 'Failed to update event' : 'Failed to save date');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto flex flex-col">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX />
        </button>
        <h2 className="text-2xl font-bold mb-6">{event ? 'Edit Event' : 'Add New Date'}</h2>
        <form onSubmit={handleSave} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="e.g., John's Birthday"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><FiCalendar /></span>
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                if (e.target.value === 'Anniversary' || e.target.value === 'Birthday') {
                  setRecurrence('Yearly');
                } else if (recurrence === 'Yearly') {
                  setRecurrence('Monthly');
                }
              }}
            >
              {categoryOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-3 mt-1">
              {colorOptions.map(opt => (
                <button
                  type="button"
                  key={opt.name}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${opt.color} ${color === opt.name ? 'border-gray-900 ring-2 ring-blue-300' : 'border-white'}`}
                  onClick={() => setColor(opt.name)}
                  aria-label={opt.name}
                >
                  {color === opt.name && <span className="text-white text-lg">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reminders</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {reminderOptions.map(opt => (
                <button
                  type="button"
                  key={opt}
                  className={`px-3 py-1 rounded-lg font-semibold border ${reminders.includes(opt) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                  onClick={() => handleReminderToggle(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
              disabled={category === 'Anniversary' || category === 'Birthday'}
            >
              {recurrenceOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Add any additional details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-between gap-2 pt-2 mt-auto">
            <button
              type="button"
              className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 