import { FC, useState } from "react";
import { addDays, subHours, setHours, setMinutes, addMinutes, subMinutes, setYear, setMonth, setDate } from 'date-fns';
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

interface ISOScheduleEntry {
  day: Date;
  wakeTime: Date;
  tempMinimum: Date;
  lightExposureStart: Date;
  lightExposureEnd: Date;
  bedtimeSuggestion: Date;
}

interface GenerateProps {
  onScheduleGenerated?: (schedule: ScheduleEntry[]) => void;
}

const Generate: FC<GenerateProps> = ({ onScheduleGenerated }) => {
  const [userWakeTime, setUserWakeTime] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'advance' | 'delay'>('advance');
  const [adjustmentDays, setAdjustmentDays] = useState<number>(3);
  const [totalHoursToShift, setTotalHoursToShift] = useState<number>(6); // New state for total hours to shift
  const [isoSchedule, setIsoSchedule] = useState<ISOScheduleEntry[] | null>(null);

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
        // console.log("Current wake time: ", currentWakeTime);
        // console.log("--------------------------------");
        const totalMinutesToShift = totalHoursToShift * 60; // Convert hours to minutes
        const minutesPerDay = totalMinutesToShift / adjustmentDays; // Calculate daily shift in minutes
        const minutesShiftDirection = adjustmentType === 'advance' ? -1 : 1; // Negative for advance, positive for delay
    
        const newSchedule: ScheduleEntry[] = [];
        const newScheduleEntry: ISOScheduleEntry[] = [];
    
        for (let day = 1; day <= adjustmentDays; day++) {
          const date = addDays(new Date(), day);
        //   console.log("Date: ", date);
    
          // Set the base date for this day's wake time to match the schedule day
          const baseWakeTimeForDay = setYear(
            setMonth(
              setDate(currentWakeTime, date.getDate()),
              date.getMonth()
            ),
            date.getFullYear()
          );
    
          // Calculate the shift for this day
          const totalShiftMinutes = minutesShiftDirection * minutesPerDay * day;
        //   console.log("Total shift minutes for day ", day, " is ", totalShiftMinutes, "type of totalShiftMinutes: ", typeof totalShiftMinutes);
          const newWakeTime = addMinutes(baseWakeTimeForDay, totalShiftMinutes);
        //   console.log("Base wake time for day ", day, " is ", baseWakeTimeForDay, "type of baseWakeTimeForDay: ", typeof baseWakeTimeForDay);
          console.log("New wake time for day ", day, " is ", newWakeTime, "type of newWakeTime: ", typeof newWakeTime);
 
    
          const newTempMinimum = calculateTempMinimum(newWakeTime);
          console.log("New temp minimum for day ", day, " is ", newTempMinimum, "type of newTempMinimum: ", typeof newTempMinimum);
          // Light exposure windows (using minutes instead of hours for consistency)
          const newLightExposureStart = adjustmentType === 'advance'
            ? addMinutes(newTempMinimum, 4 * 60) // 4 hours = 240 minutes
            : subMinutes(newTempMinimum, 6 * 60); // 6 hours = 360 minutes
    
          const newLightExposureEnd = adjustmentType === 'advance'
            ? addMinutes(newTempMinimum, 6 * 60) // 6 hours = 360 minutes
            : subMinutes(newTempMinimum, 4 * 60); // 4 hours = 240 minutes
    
          // Bedtime suggestion (7 hours before wake time)
          const bedtimeSuggestion = subHours(newWakeTime, 7);
        //   console.log("New bedtime suggestion for day ", day, " is ", bedtimeSuggestion, "type of bedtimeSuggestion: ", typeof bedtimeSuggestion);
        //   console.log("--------------------------------");
        //   console.log("\n");
        //  console.log("New string schedule entry for day ", day, " is ", newSchedule);

          newScheduleEntry.push({
            day: date,
            wakeTime: newWakeTime,
            tempMinimum: newTempMinimum,
            lightExposureStart: newLightExposureStart,
            lightExposureEnd: newLightExposureEnd,
            bedtimeSuggestion: bedtimeSuggestion,
          });
          console.log("New ISO schedule entry for day ", day, " is ", newScheduleEntry);
        }
        setIsoSchedule(newScheduleEntry);
    
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
    if (!isoSchedule) return;
    try {
        const events: any[] = [];

        isoSchedule.forEach((entry, _) => {

            events.push({
                start: [entry.wakeTime.getFullYear(), entry.wakeTime.getMonth(), entry.wakeTime.getDate(), entry.wakeTime.getHours(), entry.wakeTime.getMinutes()],
                duration: { minutes: 30 },
                title: 'Wake Up - Circadian Adjustment',
                description: `Wake up time for circadian rhythm adjustment. Temperature minimum occurs around ${entry.tempMinimum}.`,
                location: 'Home',
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
            });

            events.push({
                start: [entry.lightExposureStart.getFullYear(), entry.lightExposureStart.getMonth(), entry.lightExposureStart.getDate(), entry.lightExposureStart.getHours(), entry.lightExposureStart.getMinutes()],
                end: [entry.lightExposureEnd.getFullYear(), entry.lightExposureEnd.getMonth(), entry.lightExposureEnd.getDate(), entry.lightExposureEnd.getHours(), entry.lightExposureEnd.getMinutes()],
                title: `Light Exposure - ${adjustmentType === 'advance' ? 'Phase Advance' : 'Phase Delay'}`,
                description: 'Get bright light exposure during this window for circadian rhythm adjustment.',
                location: 'Anywhere with bright light',
            });

            events.push({
                start: [entry.bedtimeSuggestion.getFullYear(), entry.bedtimeSuggestion.getMonth(), entry.bedtimeSuggestion.getDate(), entry.bedtimeSuggestion.getHours(), entry.bedtimeSuggestion.getMinutes()],
                duration: { minutes: 30 },
                title: 'Bedtime - Circadian Adjustment',
                description: 'Suggested bedtime for circadian rhythm adjustment.',
                location: 'Home',
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
            link.download = 'circadian-adjustment-schedule-iso.ics';
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
            <div className="form-group-logging">
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

            {/* <div className="radio-group">
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
            </div> */}
            <div className="form-group-logging">
              <label className="">
                  Traveling direction:
              </label>
              <select
                  value={adjustmentDays}
                  onChange={(e) => setAdjustmentType(e.target.value as 'advance' | 'delay')}
                  className=""
              >
                  <option value={"advance"}>East (shift to ealier wake up time)</option>
                  <option value={"delay"}>West (shift to later wake up time)</option>
              </select>
            </div>

            <div className="form-group-logging">
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

            <div className="form-group-logging">
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
            className=""
            >
            Generate Schedule
            </button>
        </div>

        {isoSchedule && (
            <div className="">
                <h3 className="">Your Circadian Adjustment Schedule has been generated</h3>
                <div className="">
                    <h4 className="">How to use this schedule:</h4>
                    <ul className="">
                    {isoSchedule.map((entry, index) => {
                        return (
                            <li>
                                <p>Your temperature minimum occurs at {entry.tempMinimum.toLocaleTimeString()} on day {index + 1}</p>
                            </li>
                        )
                    })}
                    <li>For {adjustmentType === 'advance' ? 'traveling east, you should get bright light 4-6 hours AFTER ' : 'traveling west, you should get bright light 6-4 hours BEFORE'} your temperature minimum.</li>
                    <li>For best results, try to adjust your meal times to align with your new schedule.</li>
                    </ul>
                </div>

                <div className="">
                    <button
                    onClick={generateCalendarFile}
                    className=""
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
