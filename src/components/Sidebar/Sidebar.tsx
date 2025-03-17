import { NavLink } from 'react-router-dom';
import React, { FC } from 'react';
import './Sidebar.css';

interface SidebarProps {}

const Sidebar: FC<SidebarProps> = () => (
  <div className="sidebar">
      <h2>Sleep App</h2>
      <nav>
        <ul>
          <li>
            <NavLink to="/log" className={({ isActive }) => (isActive ? 'active' : '')}>
              Log
            </NavLink>
          </li>
          <li>
            <NavLink to="/generate" className={({ isActive }) => (isActive ? 'active' : '')}>
              Generate New Schedule
            </NavLink>
          </li>
          <li>
            <NavLink to="/analyze" className={({ isActive }) => (isActive ? 'active' : '')}>
              Analyze
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
);

export default Sidebar;
