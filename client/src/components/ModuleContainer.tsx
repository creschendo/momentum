import React from 'react';
import useModuleStatus from '../hooks/useModuleStatus';
import ModuleCard from './ModuleCard';

interface ModuleContainerProps {
  moduleKey: string;
  title: string;
  description: string;
}

export default function ModuleContainer({ moduleKey, title, description }: ModuleContainerProps) {
  const status = useModuleStatus(moduleKey);
  return <ModuleCard title={title} description={description} status={status} />;
}
