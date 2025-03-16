import React, { FC, useState, FormEvent } from "react";
import { format, addDays, parseISO, addHours, subHours, setHours, setMinutes } from 'date-fns';
import * as ics from "ics";

// Define types for the schedule entries and props
interface ScheduleEntry {
    day: string;
    wakeTime: string;
    tempMinimum: string;
    lightExposure: string;
    bedtimeSuggestion: string;
  }

interface GenerateProps {
    onScheduleGenerated?: (schedule: ScheduleEntry[]) => void;
};

// Interface for user input
interface UserInput {
    origin: string;
    destination: string;
    usualWakeTime: string; // e.g., "07:00"
    usualSleepTime: string; // e.g., "23:00"
    adjustmentDays: number; // Number of days to shift
  }
  
  // Interface for a daily schedule
  interface DailySchedule {
    day: number;
    wakeTime: string; // e.g., "08:30 CET"
    sleepTime: string; // e.g., "00:30 CET"
    lightExposure: string; // e.g., "Expose to light 22:00-00:00"
    lightAvoidance: string; // e.g., "Avoid light before 07:00"
  }

const Generate: FC<GenerateProps> = ({ onScheduleGenerated }) => {
    const [userWakeTime, setUserWakeTime] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'advance' | 'delay'>('advance');
  const [adjustmentDays, setAdjustmentDays] = useState<number>(3);
  const [schedule, setSchedule] = useState<ScheduleEntry[] | null>(null);

  // Convert HH:MM string to a Date object using today's date
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    return setMinutes(setHours(date, hours), minutes);
  };

  // Calculate temperature minimum (2 hours before wake time)
  const calculateTempMinimum = (wakeTime: Date): Date => {
    return subHours(wakeTime, 2);
  };

  // Calculate new wake times based on adjustment type
  const generateSchedule = () => {
    if (!userWakeTime) return;
    
    try {
      // Convert HH:MM string to Date object instead of using parseISO
      const currentWakeTime = timeStringToDate(userWakeTime);
      const tempMinimum = calculateTempMinimum(currentWakeTime);
      
      // Determine light exposure window based on adjustment type
      const lightExposureStart = adjustmentType === 'advance' 
        ? addHours(tempMinimum, 4) 
        : subHours(tempMinimum, 6);
      
      const lightExposureEnd = adjustmentType === 'advance'
        ? addHours(tempMinimum, 6)
        : subHours(tempMinimum, 4);
      
      // Calculate new wake times (15-minute shift each day)
      const newSchedule: ScheduleEntry[] = [];
      const minutesShift = adjustmentType === 'advance' ? -15 : 15;
      
      for (let day = 1; day <= adjustmentDays; day++) {
        const date = addDays(new Date(), day);
        
        // Calculate shifted wake time (15 minutes per day)
        const shiftMinutes = minutesShift * day;
        const newWakeTime = new Date(currentWakeTime);
        newWakeTime.setMinutes(newWakeTime.getMinutes() + shiftMinutes);
        
        const newTempMinimum = subHours(newWakeTime, 2);
        
        // Light exposure windows
        const newLightExposureStart = adjustmentType === 'advance'
          ? addHours(newTempMinimum, 4)
          : subHours(newTempMinimum, 6);
        
        const newLightExposureEnd = adjustmentType === 'advance'
          ? addHours(newTempMinimum, 6)
          : subHours(newTempMinimum, 4);
        
        // Bedtime suggestion (8 hours before wake time)
        const bedtimeSuggestion = subHours(newWakeTime, 8);
        
        newSchedule.push({
          day: format(date, 'EEEE, MMM d'),
          wakeTime: format(newWakeTime, 'HH:mm'),
          tempMinimum: format(newTempMinimum, 'HH:mm'),
          lightExposure: `${format(newLightExposureStart, 'HH:mm')} - ${format(newLightExposureEnd, 'HH:mm')}`,
          bedtimeSuggestion: format(bedtimeSuggestion, 'HH:mm')
        });
      }
      
      setSchedule(newSchedule);
      
      // Call the callback if provided
      if (onScheduleGenerated) {
        onScheduleGenerated(newSchedule);
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("There was an error generating your schedule. Please check your input and try again.");
    }
  };

  // Generate ICS file for calendar download
  const generateCalendarFile = () => {
    if (!schedule) return;

    try {
      const events: any[] = [];
      
      schedule.forEach((day, index) => {
        // Parse the date
        const eventDate = addDays(new Date(), index + 1);
        const year = eventDate.getFullYear();
        const month = eventDate.getMonth() + 1; // Month is 0-indexed in JS
        const dateNum = eventDate.getDate();
        
        // Parse wake time
        const [wakeHour, wakeMinute] = day.wakeTime.split(':').map(Number);
        
        // Parse bedtime
        const [bedHour, bedMinute] = day.bedtimeSuggestion.split(':').map(Number);
        
        // Parse light exposure times
        const [lightStart, lightEnd] = day.lightExposure.split(' - ');
        const [lightStartHour, lightStartMinute] = lightStart.split(':').map(Number);
        const [lightEndHour, lightEndMinute] = lightEnd.split(':').map(Number);
        
        // Adjust for events that might cross midnight
        let bedDay = dateNum;
        let bedMonth = month;
        let bedYear = year;
        
        if (bedHour < wakeHour) {
          // If bedtime is earlier in the day than wake time, it's the next day
          const nextDay = new Date(year, month - 1, dateNum + 1);
          bedDay = nextDay.getDate();
          bedMonth = nextDay.getMonth() + 1;
          bedYear = nextDay.getFullYear();
        }

        // Create wake-up event
        events.push({
          start: [year, month, dateNum, wakeHour, wakeMinute],
          duration: { minutes: 30 },
          title: 'Wake Up - Circadian Adjustment',
          description: `Wake up time for circadian rhythm adjustment. Temperature minimum occurs around ${day.tempMinimum}.`,
          location: 'Home',
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
        });

        // Create light exposure event
        events.push({
          start: [year, month, dateNum, lightStartHour, lightStartMinute],
          end: [year, month, dateNum, lightEndHour, lightEndMinute],
          title: `Light Exposure - ${adjustmentType === 'advance' ? 'Phase Advance' : 'Phase Delay'}`,
          description: 'Get bright light exposure during this window for circadian rhythm adjustment.',
          location: 'Anywhere with bright light',
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
        });

        // Create bedtime event
        events.push({
          start: [bedYear, bedMonth, bedDay, bedHour, bedMinute],
          duration: { minutes: 30 },
          title: 'Bedtime - Circadian Adjustment',
          description: 'Suggested bedtime for circadian rhythm adjustment.',
          location: 'Home',
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
        });
      });

      // Create ICS file
      ics.createEvents(events, (error, value) => {
        if (error) {
          console.error(error);
          alert("There was an error creating the calendar file.");
          return;
        }
        
        // Create download link for the ICS file
        const blob = new Blob([value], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'circadian-adjustment-schedule.ics';
        link.href = url;
        link.click();
      });
    } catch (error) {
      console.error("Error generating calendar file:", error);
      alert("There was an error creating the calendar file.");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Circadian Rhythm Adjustment</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What time do you usually wake up?
          </label>
          <input
            type="time"
            value={userWakeTime}
            onChange={(e) => setUserWakeTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Do you want to wake up earlier or later?
          </label>
          <div className="flex space-x-4 mt-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="adjustment"
                value="advance"
                checked={adjustmentType === 'advance'}
                onChange={() => setAdjustmentType('advance')}
                className="form-radio"
              />
              <span className="ml-2">Earlier (Phase Advance)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="adjustment"
                value="delay"
                checked={adjustmentType === 'delay'}
                onChange={() => setAdjustmentType('delay')}
                className="form-radio"
              />
              <span className="ml-2">Later (Phase Delay)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of adjustment days:
          </label>
          <select
            value={adjustmentDays}
            onChange={(e) => setAdjustmentDays(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
            <option value={4}>4 days</option>
            <option value={5}>5 days</option>
          </select>
        </div>
        
        <button
          onClick={generateSchedule}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Generate Schedule
        </button>
      </div>
      
      {schedule && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Your Circadian Adjustment Schedule</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wake Up</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Light Exposure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedtime</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map((day, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.day}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.wakeTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.lightExposure}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.bedtimeSuggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-800">How to use this schedule:</h4>
            <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
              <li>Your temperature minimum occurs around {schedule[0].tempMinimum} (2 hours before your wake time)</li>
              <li>For {adjustmentType === 'advance' ? 'phase advancement' : 'phase delay'}, get bright light exposure during the suggested light exposure window</li>
              <li>Try to maintain consistent timing each day</li>
              <li>Avoid bright lights outside the recommended window</li>
            </ul>
          </div>
          
          <div className="mt-4 flex justify-center">
            <button
              onClick={generateCalendarFile}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Download Calendar Schedule (.ics)
            </button>
          </div>
        </div>
      )}
    </div>
    )
};

export default Generate;