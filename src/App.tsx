import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import SleepLog from './pages/SleepLog';
import Generate from './pages/Generate';
import Analyze from './pages/Analyze';
import './App.css';

function App() {

  return (
    <Router>
      fasdfdsaf
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<SleepLog />} />
          <Route path="/log" element={<SleepLog />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/analyze" element={<Analyze />} />
        </Routes>
      </div>
    </div>
  </Router>
  )
}

export default App
