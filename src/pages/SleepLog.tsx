import React, { FC, useState, FormEvent } from 'react';
import { differenceInMinutes, parseISO, parse, addDays } from 'date-fns';
import './SleepLog.css';

interface SleepLogProps {
  date?: string;
}

interface SleepLogFormData {
  date: string;
  startTime: string; // ISO string (e.g., 2023-10-14T23:00)
  endTime: string; // ISO string (e.g., 2023-10-15T07:00)
  sleepQuality: string;
  wakeUpCount: number;
}

const SleepLog: FC<SleepLogProps> = ({ date }) => {

  // State for the form inputs
  const [formData, setFormData] = useState<SleepLogFormData>({
    date: new Date().toISOString().split('T')[0], // Default to today's date
    startTime: '',
    endTime: '',
    sleepQuality: 'Fair', // Default value for sleep quality
    wakeUpCount: 0, // Default value for wake-up count
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'hoursSlept' || name === 'wakeUpCount' ? parseFloat(value) : value,
    }));
  };

  // for combining date and time to iso string 
  const combineDateAndTime = (date: string, time: string, adjustDay = 0): string => {
    if (!date || !time) return '';
    const datePart = parseISO(date);
    const timeParts = time.split(':');
    const adjustedDate = adjustDay ? addDays(datePart, adjustDay) : datePart;
    adjustedDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
    return adjustedDate.toISOString();
  };

  // Calculate sleep duration in hours
  const calculateSleepDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const minutes = differenceInMinutes(endDate, startDate);
    return minutes / 60; // Convert to hours
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Make sure startTime and endTime are provided
    if (!formData.startTime || !formData.endTime) {
      alert('Please provide both start and end times.');
      return;
    }

    // Parse startTime and endTime to determine if endTime is on the next day
    const startHours = parseInt(formData.startTime.split(':')[0]);
    const endHours = parseInt(formData.endTime.split(':')[0]);
    const isNextDay = endHours < startHours; // If end time is earlier in the day, assume next day

    // Combine date with startTime and endTime
    const startDateTime = combineDateAndTime(formData.date, formData.startTime);
    const endDateTime = combineDateAndTime(formData.date, formData.endTime, isNextDay ? 1 : 0);

    // get the duration of the sleep
    const duration = calculateSleepDuration(startDateTime, endDateTime);
    if (duration <= 0) {
      alert('End time must be after start time.');
      return;
    }

    // Structure the data as a FHIR Observation resource with components
    const observation: any = {
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '60832-3', // Main code for "Sleep duration"
            display: 'Sleep duration',
          },
        ],
      },
      subject: {
        reference: 'Patient/123', // Replace with actual patient reference
      },
      effectivePeriod: {
        start: formData.startTime,
        end: formData.endTime,
      },
      valueQuantity: {
        value: duration,
        unit: 'hours',
        system: 'http://unitsofmeasure.org',
        code: 'h',
      },
      component: [
        // Component for sleep quality
        {
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct', // Using SNOMED for qualitative assessment
                code: '271795006', // Placeholder SNOMED code for "Sleep quality"
                display: 'Sleep quality',
              },
            ],
          },
          valueCodeableConcept: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: mapSleepQualityToSnomed(formData.sleepQuality),
                display: formData.sleepQuality,
              },
            ],
            text: formData.sleepQuality,
          },
        },
        // Component for number of wake-ups
        {
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '93830-8', // Placeholder LOINC code (not standard, but for demo purposes)
                display: 'Number of awakenings during sleep',
              },
            ],
          },
          valueQuantity: {
            value: formData.wakeUpCount,
            unit: 'times',
            system: 'http://unitsofmeasure.org',
            code: '{times}',
          },
        },
      ],
    };

    // Log the FHIR Observation to the console (or send to a server)
    console.log('FHIR Observation:', observation);

    // Reset the form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      sleepQuality: 'Fair',
      wakeUpCount: 0,
    });
  };

  // Helper to map sleep quality to SNOMED codes (placeholder codes for demo)
  const mapSleepQualityToSnomed = (quality: string): string => {
    switch (quality) {
      case 'Poor':
        return '248255005'; // Placeholder SNOMED code for "Poor sleep"
      case 'Fair':
        return '248256006'; // fair
      case 'Good':
        return '248257002'; // good
      case 'Excellent':
        return '248258007'; // excellent
      default:
        return '271795006'; // generic
    }
  };
  
  return (
    <div className="sleep-log">
      <h1>Log Your Sleep</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="endTime">End Time:</label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sleepQuality">Sleep Quality:</label>
          <select
            id="sleepQuality"
            name="sleepQuality"
            value={formData.sleepQuality}
            onChange={handleChange}
            required
          >
            <option value="Poor">Poor</option>
            <option value="Fair">Fair</option>
            <option value="Good">Good</option>
            <option value="Excellent">Excellent</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="wakeUpCount">Number of Times Woke Up:</label>
          <input
            type="number"
            id="wakeUpCount"
            name="wakeUpCount"
            value={formData.wakeUpCount}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>
        <button type="submit">Log Sleep</button>
      </form>

      {/* Maybe display passed props (e.g., past logs) */}
      {date && (
        <div className="past-log">
          <h2>Past Log</h2>
          <p>Date: {date}</p>
        </div>
      )}
    </div>
  )

};

export default SleepLog;
