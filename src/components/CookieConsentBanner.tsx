"use client";
import { useEffect, useState } from 'react';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookie_consent');
      setVisible(consent !== 'true');
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white p-4 flex justify-between items-center z-50">
      <span>
        We use cookies to improve your experience. By using our site, you accept our use of cookies.
      </span>
      <button
        className="ml-4 px-4 py-2 bg-blue-600 rounded text-white font-semibold"
        onClick={acceptCookies}
      >
        Accept
      </button>
    </div>
  );
} 