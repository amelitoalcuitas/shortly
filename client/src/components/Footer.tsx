import React from "react";
import { Copyright } from "@phosphor-icons/react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white p-4 text-center text-gray-600 text-sm border-t border-gray-200">
      <p className="flex items-center justify-center">
        <Copyright className="mr-1 h-4 w-4" weight="bold" />
        {new Date().getFullYear()}{" "}
        <span className="text-primary font-medium ml-1">shortly</span>. All
        rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
