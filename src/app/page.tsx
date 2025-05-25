import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/home');
  }

  // Full landing page for unauthenticated users
  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-2xl text-purple-600 font-bold">🎂</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">BirthdayBuddy</span>
        </div>
        <div className="flex gap-2">
          <a href="/auth/signin" className="px-4 py-2 text-purple-700 font-semibold hover:underline">Log In</a>
          <a href="/auth/signup" className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors">Sign Up</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-4">
            Never Miss an <span className="text-purple-600">Important Date</span> Again
          </h1>
          <p className="text-gray-600 mb-8">
            BirthdayBuddy helps you remember birthdays, anniversaries, and other special events with timely reminders via email, SMS, or WhatsApp.
          </p>
          <a href="/auth/signup" className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors text-lg">Get Started — It&apos;s Free</a>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-80 h-56 bg-gray-100 rounded-lg shadow flex items-center justify-center">
            <span className="text-6xl text-purple-400">📅</span>
            <span className="sr-only">Calendar Reminder</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose BirthdayBuddy?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-purple-50 p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl text-purple-600">📝</div>
              <h3 className="text-xl font-semibold mb-2">Easy Reminder Management</h3>
              <p className="text-gray-600">Add birthdays, anniversaries, and custom events in seconds. Our intuitive interface makes it easy to stay organized.</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl text-blue-600">⏰</div>
              <h3 className="text-xl font-semibold mb-2">Timely Notifications</h3>
              <p className="text-gray-600">Get reminders exactly when you need them — same day, one day before, or weeks in advance. You decide!</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl text-green-600">💬</div>
              <h3 className="text-xl font-semibold mb-2">Multiple Channels</h3>
              <p className="text-gray-600">Choose how you want to be reminded — via email, SMS, or WhatsApp messages. Stay connected your way.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-gray-600 mb-12">Three simple steps to never forget important dates again</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-purple-600">1</div>
              <h3 className="text-xl font-semibold mb-2">Create an Account</h3>
              <p className="text-gray-600">Sign up for free and set up your personal reminder preferences</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-purple-600">2</div>
              <h3 className="text-xl font-semibold mb-2">Add Important Dates</h3>
              <p className="text-gray-600">Add birthdays, anniversaries, or any special event to your calendar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-purple-600">3</div>
              <h3 className="text-xl font-semibold mb-2">Receive Reminders</h3>
              <p className="text-gray-600">Get timely notifications through your preferred channels</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {false && (
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-gray-600 mb-12">Choose the plan that works best for you</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border rounded-lg p-8 bg-white">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-500">/month</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Up to 5 reminders</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Email notifications</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Basic reminder settings</li>
                <li className="flex items-center"><span className="text-gray-300 mr-2">✖</span> <span className="text-gray-400">Ad-supported experience</span></li>
              </ul>
              <a href="/auth/signup" className="w-full block text-center px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors">Start for Free</a>
            </div>
            <div className="border rounded-lg p-8 bg-white border-purple-200 shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Premium</h3>
              <div className="text-4xl font-bold mb-6">$4.99<span className="text-lg text-gray-500">/month</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Unlimited reminders</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Email, SMS & WhatsApp notifications</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Advanced reminder settings</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Ad-free experience</li>
              </ul>
              <a href="/auth/signup" className="w-full block text-center px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors">Get Premium</a>
            </div>
          </div>
        </div>
      </section>
      )}
    </main>
  );
}
