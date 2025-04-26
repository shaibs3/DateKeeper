export function Header() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-purple-600">
              🎂 BirthdayBuddy
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/auth/login" className="text-gray-600 hover:text-gray-900">
              Log In
            </a>
            <a href="/auth/signup" className="btn-primary">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </header>
  );
} 