import React from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import CalendarApp from './CalendarApp';

export default function ProductivityModule() {
  return (
    <div>
      <ModuleContainer moduleKey="productivity" title="Productivity" description="Calendar workspace with daily, weekly, and monthly planning views." />
      <CalendarApp />
    </div>
  );
}
