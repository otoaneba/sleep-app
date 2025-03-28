import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import SleepLog from './pages/SleepLog';
import Generate from './pages/Generate';
import Analyze from './pages/Analyze';
import './App.css';

function App() {

  return (
    <Router basename={import.meta.env.DEV ? "/" : "/sleep-app/"}>
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path={import.meta.env.DEV ? "/" : "/"} element={<SleepLog />} />
          <Route path={import.meta.env.DEV ? "/log" : "log"} element={<SleepLog />} />
          <Route path={import.meta.env.DEV ? "/generate" : "generate"} element={<Generate />} />
          <Route path={import.meta.env.DEV ? "/analyze" : "analyze"} element={<Analyze />} />
        </Routes>
      </div>
    </div>
  </Router>
  )
}

export default App
