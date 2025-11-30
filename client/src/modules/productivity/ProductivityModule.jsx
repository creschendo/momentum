import React from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import Tasks from './Tasks';

export default function ProductivityModule() {
  return (
    <div>
      <ModuleContainer moduleKey="productivity" title="Productivity" description="Tasks, timers, notes, and general productivity tools." />
      <Tasks />
    </div>
  );
}
