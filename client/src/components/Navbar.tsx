import React from "react";
import { useAuth } from "../hooks/useAuth";
import { SignOut } from "@phosphor-icons/react";

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-white font-medium text-gray-700 p-4 border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        <div className="relative h-8">
          <a href="/" className="flex items-center space-x-2 h-full">
            <img src="shortly.png" alt="shortly" className="h-full" />
          </a>
        </div>

        <div className="flex space-x-4 items-center">
          {!isAuthenticated ? (
            <a href="/" className="hover:text-primary flex items-center">
              Home
            </a>
          ) : null}

          {isAuthenticated ? (
            <>
              <span className="text-gray-600">{user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium flex items-center"
              >
                <SignOut className="h-4 w-4 mr-1" weight="bold" />
                Logout
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors font-medium flex items-center"
            >
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
