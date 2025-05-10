function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">Shortly</div>
          <div className="flex space-x-4">
            <a href="#" className="hover:underline">
              Home
            </a>
            <a href="#" className="hover:underline">
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            Shorten Your URL
          </h2>
          <div className="mb-4">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter your long URL
            </label>
            <input
              type="text"
              id="url"
              placeholder="https://example.com/very/long/url/that/needs/shortening"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors font-medium">
            Shorten URL
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} Shortly. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;
