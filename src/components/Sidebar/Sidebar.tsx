import { NavLink } from 'react-router-dom';
import { FC, useState } from 'react';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import HamburgerMenu from '../HamburgerMenu/HamburgerMenu';

interface SidebarProps {}

const Sidebar: FC<SidebarProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <HamburgerMenu isOpen={isOpen} toggleMenu={toggleMenu} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <FontAwesomeIcon icon={faBed} className='app-icon' />
        <nav>
          <ul>
            <li>
              <NavLink 
                to={import.meta.env.DEV ? "/log" : "log"} 
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={handleLinkClick}
              >
                Log
              </NavLink>
            </li>
            <li>
              <NavLink 
                to={import.meta.env.DEV ? "/generate" : "generate"} 
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={handleLinkClick}
              >
                Generate New Schedule
              </NavLink>
            </li>
            <li>
              <NavLink 
                to={import.meta.env.DEV ? "/analyze" : "analyze"} 
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={handleLinkClick}
              >
                Analyze
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
