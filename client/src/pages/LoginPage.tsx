import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full border border-gray-200">
          <h2 className="text-2xl font-semibold text-center mb-6 text-primary">
            login to shortly
          </h2>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2 flex items-center"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center"
            >
              Login
            </button>
          </form>

          <div className="mt-6 flex justify-between text-sm">
            <a
              href="#"
              className="text-primary hover:text-primary-dark flex items-center"
            >
              Sign up
            </a>
            <a
              href="#"
              className="text-primary hover:text-primary-dark flex items-center"
            >
              Forgot password?
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;
