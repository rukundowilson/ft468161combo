import LoginForm from './components/LoginForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
          {/* Left side - Hero content */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Manage Your Money
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Track expenses, visualize spending patterns, and take control of your finances with our intuitive personal finance tracker.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                <p className="text-sm sm:text-base text-gray-700">
                  Real-time expense tracking
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                <p className="text-sm sm:text-base text-gray-700">
                  Smart analytics & insights
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-600 mt-2"></div>
                <p className="text-sm sm:text-base text-gray-700">
                  Export & backup your data
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="flex justify-center lg:justify-end">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
