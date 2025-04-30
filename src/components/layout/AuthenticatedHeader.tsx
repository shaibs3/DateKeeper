"use client";

import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FiCalendar, FiBell, FiSettings, FiMoon, FiLogOut } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';

export function AuthenticatedHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/home')}>
        <div className="text-2xl text-blue-500"><FiCalendar /></div>
        <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Datekeeper</span>
      </div>
      <nav className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/home')} className="text-blue-600 bg-blue-100 px-3 py-1 rounded-lg flex items-center gap-1 font-semibold"><FiCalendar className="text-lg" /> Dashboard</button>
          <button onClick={() => router.push('/reminders')} className="text-gray-500 hover:text-blue-600"><FiBell className="text-xl" /></button>
          <div className="relative" ref={menuRef}>
            {session?.user?.image ? (
              <button
                className="focus:outline-none"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border-2 border-gray-200 object-cover hover:border-blue-400 transition-all"
                />
              </button>
            ) : (
              <button
                className="text-gray-500 hover:text-blue-600 focus:outline-none"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <FiSettings className="text-xl" />
              </button>
            )}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { setMenuOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  <FiSettings className="text-lg" /> Settings
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg border-t border-gray-100"
                >
                  <FiLogOut className="text-lg text-red-500" /> Sign Out
                </button>
              </div>
            )}
          </div>
          <button className="text-gray-500 hover:text-blue-600"><FiMoon className="text-xl" /></button>
        </div>
      </nav>
    </header>
  );
} 