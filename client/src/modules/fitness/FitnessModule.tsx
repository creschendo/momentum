import React from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import Splits from './Splits';

export default function FitnessModule() {
  return (
    <div>
      <ModuleContainer moduleKey="fitness" title="Fitness" description="Create and manage workout splits with lifts and cardio." />
      <Splits />
    </div>
  );
}
