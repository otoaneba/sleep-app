import { FC, useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { parseISO, format, subDays, differenceInDays, addDays } from 'date-fns';
import './Analyze.css';
import { analyzeWithAzureAI } from '../services/azureAI';
import { SleepData } from '../models/sleep';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define the shape of an Observation (simplified)
interface SleepObservation {
  resourceType: string;
  effectivePeriod: { start: string; end: string };
  valueQuantity: { value: number; unit: string };
  component: Array<{
    code: { coding: Array<{ code: string; display: string }> };
    valueCodeableConcept?: { text: string };
    valueQuantity?: { value: number; unit: string };
  }>;
}

interface AnalyzeProps {};

const Analyze: FC<AnalyzeProps> = () => {
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 7), 'yyyy-MM-dd')); // Default: last 7 days
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [observations, setObservations] = useState<SleepObservation[]>([]);

  // Fetch data from local storage on mount
  useEffect(() => {
    const storedObservations = JSON.parse(localStorage.getItem('sleepObservations') || '[]');
    setObservations(storedObservations);
    console.log("storedObservations: ", storedObservations[0])
    console.log("observations: ",
      "Sleep quality: ",storedObservations[0].component[0].valueCodeableConcept.text,
      "\nwake-ups: ",storedObservations[0].component[1].valueQuantity.value,
      "\nSleep time: ",storedObservations[0].effectivePeriod.start,
      typeof storedObservations[0].effectivePeriod.start,
      "\nWake-up time: ",storedObservations[0].effectivePeriod.end,
      "\nSleep duration: ",storedObservations[0].valueQuantity.value)
  }, []);

  // Filter observations by date range
  const filteredObservations = observations.filter((obs) => {
    const obsDate = parseISO(obs.effectivePeriod.start).toISOString().split('T')[0];
    return obsDate >= startDate && obsDate <= endDate;
  });

  // Aggregate data for charts
  const datesInRange = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const daysDiff = differenceInDays(end, start);
  for (let i = 0; i <= daysDiff; i++) {
    const date = format(addDays(start, i), 'yyyy-MM-dd');
    datesInRange.push(date);
  }

  // Total sleep duration per day
  const sleepDurationData = datesInRange.map((date) => {
    const dailyObservations = filteredObservations.filter(
      (obs) => parseISO(obs.effectivePeriod.start).toISOString().split('T')[0] === date
    );
    return dailyObservations.reduce((sum, obs) => sum + obs.valueQuantity.value, 0);
  });

  // Average sleep quality per day (convert to numerical scale)
  const sleepQualityData = datesInRange.map((date) => {
    const dailyObservations = filteredObservations.filter(
      (obs) => parseISO(obs.effectivePeriod.start).toISOString().split('T')[0] === date
    );
    if (dailyObservations.length === 0) return 0;
    const qualityScores = dailyObservations.map((obs) => {
      const qualityComponent = obs.component.find(
        (comp) => comp.code.coding[0].display === 'Sleep quality'
      );
      const qualityText = qualityComponent?.valueCodeableConcept?.text || 'Poor';
      const qualityMap: { [key: string]: number } = {
        Poor: 1,
        Fair: 2,
        Good: 3,
        Excellent: 4,
      };
      return qualityMap[qualityText] || 1;
    });
    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  });

  // Total wake-ups per day
  const wakeUpsData = datesInRange.map((date) => {
    const dailyObservations = filteredObservations.filter(
      (obs) => parseISO(obs.effectivePeriod.start).toISOString().split('T')[0] === date
    );
    return dailyObservations.reduce((sum, obs) => {
      const wakeUpsComponent = obs.component.find(
        (comp) => comp.code.coding[0].display === 'Number of awakenings during sleep'
      );
      return sum + (wakeUpsComponent?.valueQuantity?.value || 0);
    }, 0);
  });

  const handleAnalysis = async () => {
    try {
      let sleepData: SleepData = observations && observations.length > 0 ? {
            sleepQuality: observations[0]?.component[0]?.valueCodeableConcept?.text || '',
            wakeUps: observations[0]?.component[1]?.valueQuantity?.value || 0,
            sleepTime: observations[0]?.effectivePeriod?.start || '',
            wakeUpTime: observations[0]?.effectivePeriod?.end || '',
            sleepDuration: observations[0]?.valueQuantity?.value || 0
        } : {
            sleepQuality: '',
            wakeUps: 0,
            sleepTime: '',
            wakeUpTime: '',
            sleepDuration: 0
        };
      
        const result = await analyzeWithAzureAI(sleepData);
        // Handle the analysis result (e.g., display it)
        console.log(result.analysis);
    } catch (error) {
        console.error('Error:', error);
    }
};

  // Chart data
  const sleepDurationChartData = {
    labels: datesInRange,
    datasets: [
      {
        label: 'Total Sleep Duration (hours)',
        data: sleepDurationData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const sleepQualityChartData = {
    labels: datesInRange,
    datasets: [
      {
        label: 'Average Sleep Quality (1-4)',
        data: sleepQualityData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const wakeUpsChartData = {
    labels: datesInRange,
    datasets: [
      {
        label: 'Total Wake-Ups',
        data: wakeUpsData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="analyze">
      <h1>Analyze Your Sleep Trends</h1>
      <div className="date-range">
        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>
      {filteredObservations.length === 0 ? (
        <p>No sleep data available for the selected date range.</p>
      ) : (
        <>
          <div className="chart">
            <h2>Total Sleep Duration Per Day</h2>
            <Bar
              data={sleepDurationChartData}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Total Sleep Duration Per Day' } } }}
            />
          </div>
          <div className="chart">
            <h2>Average Sleep Quality Per Day</h2>
            <Bar
              data={sleepQualityChartData}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Average Sleep Quality Per Day (1=Poor, 4=Excellent)' } } }}
            />
          </div>
          <div className="chart">
            <h2>Total Wake-Ups Per Day</h2>
            <Bar
              data={wakeUpsChartData}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Total Wake-Ups Per Day' } } }}
            />
          </div>
        </>
      )}
      <button onClick={handleAnalysis}>Analyze Sleep</button>
    </div>
  );
};

export default Analyze;