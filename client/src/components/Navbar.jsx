import React from "react";
import { NavLink } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

const navLinks = [
  {
    title: "Agent",
    path: "/agent"
  },
  {
    title: "Discussion",
    path: "/discussion"
  },
  {
    title: "Chatroom",
    path: "/chatroom"
  }
]

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="flex justify-between md:justify-end items-center w-full h-full py-4 px-6">
      <button onClick={toggleSidebar} className="md:hidden">
        <FiMenu className="w-6 h-6"/>
      </button>
      <ul className="flex h-full items-center space-x-10">
        {navLinks.map((link, idx) => (
          <li key={idx}>
            <NavLink
              to={link.path}
              className="text-black hover:text-gray-600 font medium text-lg"
            >
              {link.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
