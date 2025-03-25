import { NavLink } from 'react-router-dom';
import { FC } from 'react';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faBed } from '@fortawesome/free-solid-svg-icons';
interface SidebarProps {}

const Sidebar: FC<SidebarProps> = () => (
  <div className="sidebar">
      <FontAwesomeIcon icon={faBed} className='app-icon' />
      <nav>
        <ul>
          <li>
            <NavLink to={import.meta.env.DEV ? "/log" : "log"} className={({ isActive }) => (isActive ? 'active' : '')}>
              Log
            </NavLink>
          </li>
          <li>
            <NavLink to={import.meta.env.DEV ? "/generate" : "generate"} className={({ isActive }) => (isActive ? 'active' : '')}>
              Generate New Schedule
            </NavLink>
          </li>
          <li>
            <NavLink to={import.meta.env.DEV ? "/analyze" : "analyze"} className={({ isActive }) => (isActive ? 'active' : '')}>
              Analyze
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
);

export default Sidebar;
