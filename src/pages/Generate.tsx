import React, { FC, useState, FormEvent } from "react";
import { format, addHours, addMinutes, parse } from "date-fns";
import * as ics from "ics";

interface GenerateProps {};

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

const Generate: FC<GenerateProps> = () => {
    
    return (
        <div className="generate">
            <h1>Generate</h1>
        </div>
    )
};

export default Generate;