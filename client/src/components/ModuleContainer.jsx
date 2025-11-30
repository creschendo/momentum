import React from 'react';
import useModuleStatus from '../hooks/useModuleStatus';
import ModuleCard from './ModuleCard';

export default function ModuleContainer({ moduleKey, title, description }) {
  const status = useModuleStatus(moduleKey);
  return <ModuleCard title={title} description={description} status={status} />;
}
