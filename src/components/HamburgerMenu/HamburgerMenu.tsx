import React from 'react';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, toggleMenu }) => {
  return (
    <button 
      className={`hamburger-menu ${isOpen ? 'open' : ''}`} 
      onClick={toggleMenu}
      aria-label="Toggle menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
};

export default HamburgerMenu; 