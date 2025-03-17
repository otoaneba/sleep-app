import React, { FC, useState } from "react";
import { format, addDays, subHours, setHours, setMinutes, addMinutes, subMinutes } from 'date-fns';
import * as ics from "ics";
import './Generate.css';
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
}

const Generate: FC<GenerateProps> = ({ onScheduleGenerated }) => {
  const [userWakeTime, setUserWakeTime] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'advance' | 'delay'>('advance');
  const [adjustmentDays, setAdjustmentDays] = useState<number>(3);
  const [totalHoursToShift, setTotalHoursToShift] = useState<number>(6); // New state for total hours to shift
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

  // Generate the schedule based on user inputs
  const generateSchedule = () => {
    if (!userWakeTime) return;

    try {
      const currentWakeTime = timeStringToDate(userWakeTime);
      const totalMinutesToShift = totalHoursToShift * 60; // Convert hours to minutes
      const minutesPerDay = totalMinutesToShift / adjustmentDays; // Calculate daily shift in minutes
      const minutesShiftDirection = adjustmentType === 'advance' ? -1 : 1; // Negative for advance, positive for delay

      const newSchedule: ScheduleEntry[] = [];

      for (let day = 1; day <= adjustmentDays; day++) {
        const date = addDays(new Date(), day);

        // Calculate the shift for this day
        const totalShiftMinutes = minutesShiftDirection * minutesPerDay * day;
        const newWakeTime = addMinutes(currentWakeTime, totalShiftMinutes);

        const newTempMinimum = calculateTempMinimum(newWakeTime);

        // Light exposure windows (using minutes instead of hours for consistency)
        const newLightExposureStart = adjustmentType === 'advance'
          ? addMinutes(newTempMinimum, 4 * 60) // 4 hours = 240 minutes
          : subMinutes(newTempMinimum, 6 * 60); // 6 hours = 360 minutes

        const newLightExposureEnd = adjustmentType === 'advance'
          ? addMinutes(newTempMinimum, 6 * 60) // 6 hours = 360 minutes
          : subMinutes(newTempMinimum, 4 * 60); // 4 hours = 240 minutes

        // Bedtime suggestion (7 hours before wake time)
        const bedtimeSuggestion = subHours(newWakeTime, 7);

        newSchedule.push({
          day: format(date, 'EEEE, MMM d'),
          wakeTime: format(newWakeTime, 'HH:mm'),
          tempMinimum: format(newTempMinimum, 'HH:mm'),
          lightExposure: `${format(newLightExposureStart, 'HH:mm')} - ${format(newLightExposureEnd, 'HH:mm')}`,
          bedtimeSuggestion: format(bedtimeSuggestion, 'HH:mm')
        // day: date.toDateString(),
        // wakeTime: newWakeTime.toISOString(),
        // tempMinimum: newTempMinimum.toISOString(),
        // lightExposure: `${newLightExposureStart.toISOString()} - ${newLightExposureEnd.toISOString()}`,
        // bedtimeSuggestion: bedtimeSuggestion.toISOString()
        });
      }

      setSchedule(newSchedule);

      if (onScheduleGenerated) {
        onScheduleGenerated(newSchedule);
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("There was an error generating your schedule. Please check your input and try again.");
    }
  };

  // Generate ICS file for calendar download (unchanged)
  const generateCalendarFile = () => {
    if (!schedule) return;

    try {
      const events: any[] = [];

      schedule.forEach((day, index) => {
        const eventDate = addDays(new Date(), index + 1);
        const year = eventDate.getFullYear();
        const month = eventDate.getMonth() + 1;
        const dateNum = eventDate.getDate();

        const [wakeHour, wakeMinute] = day.wakeTime.split(':').map(Number);
        const [bedHour, bedMinute] = day.bedtimeSuggestion.split(':').map(Number);
        const [lightStart, lightEnd] = day.lightExposure.split(' - ');
        const [lightStartHour, lightStartMinute] = lightStart.split(':').map(Number);
        const [lightEndHour, lightEndMinute] = lightEnd.split(':').map(Number);

        let bedDay = dateNum;
        let bedMonth = month;
        let bedYear = year;

        if (bedHour < wakeHour) {
          const nextDay = new Date(year, month - 1, dateNum + 1);
          bedDay = nextDay.getDate();
          bedMonth = nextDay.getMonth() + 1;
          bedYear = nextDay.getFullYear();
        }

        events.push({
          start: [year, month, dateNum, wakeHour, wakeMinute],
          duration: { minutes: 30 },
          title: 'Wake Up - Circadian Adjustment',
          description: `Wake up time for circadian rhythm adjustment. Temperature minimum occurs around ${day.tempMinimum}.`,
          location: 'Home',
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
        });

        events.push({
          start: [year, month, dateNum, lightStartHour, lightStartMinute],
          end: [year, month, dateNum, lightEndHour, lightEndMinute],
          title: `Light Exposure - ${adjustmentType === 'advance' ? 'Phase Advance' : 'Phase Delay'}`,
          description: 'Get bright light exposure during this window for circadian rhythm adjustment.',
          location: 'Anywhere with bright light',
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
        });

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

      ics.createEvents(events, (error, value) => {
        if (error) {
          console.error(error);
          alert("There was an error creating the calendar file.");
          return;
        }

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
    <div className="generate">
   
        <h1>Circadian Rhythm Adjustment</h1>
        
        <div className="generate-content">
            <div className="form-group">
                <label>
                    What time do you usually wake up?
                </label>
                <input
                    type="time"
                    value={userWakeTime}
                    onChange={(e) => setUserWakeTime(e.target.value)}
                    className=""
                />
            </div>

            <div className="radio-group">
                <label>
                    Traveling East or West?
                </label>
                <div className="generate-radio-group">
                    <label>
                        <input
                            type="radio"
                            name="adjustment"
                            value="advance"
                            checked={adjustmentType === 'advance'}
                            onChange={() => setAdjustmentType('advance')}
                            className="form-radio"
                        />
                        <span className="ml-2">East (shift to ealier wake up time)</span>
                    </label>
                    <label className="">
                        <input
                            type="radio"
                            name="adjustment"
                            value="delay"
                            checked={adjustmentType === 'delay'}
                            onChange={() => setAdjustmentType('delay')}
                            className="form-radio"
                        />
                        <span className="ml-2">West (shift to later wake up time)</span>
                    </label>
                </div>
            </div>

            <div className="form-group">
            <label>
                Time difference (in hours) between your home and destination:
            </label>
            <input
                type="number"
                min="1"
                max="12"
                value={totalHoursToShift}
                onChange={(e) => setTotalHoursToShift(Number(e.target.value))}
                className=""
            />
            </div>

            <div className="form-group">
            <label className="">
                Number of adjustment days:
            </label>
            <select
                value={adjustmentDays}
                onChange={(e) => setAdjustmentDays(Number(e.target.value))}
                className=""
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
  );
};

export default Generate;