import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import SleepLog from './pages/SleepLog';
import Profile from './pages/Profile';
import Generate from './pages/Generate';
import Analyze from './pages/Analyze';
import './App.css';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/log" element={<SleepLog />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/analyze" element={<Analyze />} />
        </Routes>
      </div>
    </div>
  </Router>
  )
}

export default App
