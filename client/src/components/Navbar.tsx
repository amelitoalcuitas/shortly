import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white font-medium text-gray-700 p-4 border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        <div className="relative h-8">
          <a href="/" className="flex items-center space-x-2 h-full">
            <img src="shortly.png" alt="shortly" className="h-full" />
          </a>
        </div>

        <div className="flex space-x-4 items-center">
          <a href="/" className="hover:text-primary flex items-center">
            Home
          </a>

          <a
            href="/login"
            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors font-medium flex items-center"
          >
            Login
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
