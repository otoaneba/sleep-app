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
          <Route path={import.meta.env.DEV ? "/" : "/pages/nabe7/sleep-app/"} element={<SleepLog />} />
          <Route path={import.meta.env.DEV ? "/log" : "/pages/nabe7/sleep-app/log"} element={<SleepLog />} />
          <Route path={import.meta.env.DEV ? "/generate" : "/pages/nabe7/sleep-app/generate"} element={<Generate />} />
          <Route path={import.meta.env.DEV ? "/analyze" : "/pages/nabe7/sleep-app/analyze"} element={<Analyze />} />
        </Routes>
      </div>
    </div>
  </Router>
  )
}

export default App
