import React from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import PomodoroTimer from './PomodoroTimer';

export default function PomodoroModule() {
  return (
    <div>
      <ModuleContainer
        moduleKey="pomodoro"
        title="Pomodoro"
        description="Focus sessions with built-in breaks."
      />
      <PomodoroTimer />
    </div>
  );
}
