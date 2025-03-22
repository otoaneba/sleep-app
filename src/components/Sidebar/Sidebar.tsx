import { NavLink } from 'react-router-dom';
import { FC } from 'react';
import './Sidebar.css';

interface SidebarProps {}

const Sidebar: FC<SidebarProps> = () => (
  <div className="sidebar">
      <h2>Sleep App</h2>
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
