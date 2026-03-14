// ProductivityModule — top-level page component for the Productivity tab.
// Renders the module header via ModuleContainer and mounts the CalendarApp below it.
import React from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import CalendarApp from './calendar/CalendarApp';

export default function ProductivityModule() {
  return (
    <div>
      <ModuleContainer moduleKey="productivity" title="Productivity" description="Calendar workspace with daily, weekly, and monthly planning views." />
      <CalendarApp />
    </div>
  );
}
