import React from 'react';
import { motion } from 'framer-motion';
import type { NavigateFunction } from 'react-router-dom';
import { staggerContainer } from './motion/presets';
import ModuleSlot from './ModuleSlot';
import { useTheme } from '../context/ThemeContext';

interface DashboardGridProps {
  layout: (string | null)[];
  moduleSpans: Record<string, number>;
  draggedModule: string | null;
  dragOverQuadrant: number | null;
  addMenuIndex: number | null;
  setAddMenuIndex: (index: number | null) => void;
  removeConfirmIndex: number | null;
  setRemoveConfirmIndex: (index: number | null) => void;
  isCoveredSlot: (layout: (string | null)[], spans: Record<string, number>, index: number) => boolean;
  handleDragStart: (e: React.DragEvent, moduleKey: string) => void;
  handleDragOver: (e: React.DragEvent, quadrantIndex: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, targetIndex: number) => void;
  handleDragEnd: () => void;
  handleToggleExpand: (index: number) => void;
  handleRemoveModule: (quadrantIndex: number) => void;
  handleAddModule: (quadrantIndex: number, moduleKey: string) => void;
  remainingModules: string[];
  moduleTitleByKey: Record<string, string>;
  renderModule: (moduleKey: string | null) => React.ReactNode;
  navigate: NavigateFunction;
  theme: ReturnType<typeof useTheme>['theme'];
  isDark: boolean;
  prefersReducedMotion: boolean | null;
}

export default function DashboardGrid({
  layout,
  moduleSpans,
  draggedModule,
  dragOverQuadrant,
  addMenuIndex,
  setAddMenuIndex,
  removeConfirmIndex,
  setRemoveConfirmIndex,
  isCoveredSlot,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleToggleExpand,
  handleRemoveModule,
  handleAddModule,
  remainingModules,
  moduleTitleByKey,
  renderModule,
  navigate,
  theme,
  isDark,
  prefersReducedMotion
}: DashboardGridProps) {
  return (
    <motion.div
      className="module-grid"
      layout={prefersReducedMotion ? false : true}
      variants={prefersReducedMotion ? undefined : staggerContainer}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'show'}
      onClick={() => {
        if (addMenuIndex !== null) setAddMenuIndex(null);
      }}
    >
      {layout.map((_, quadrantIndex) => {
        if (isCoveredSlot(layout, moduleSpans, quadrantIndex)) return null;

        const moduleKey = layout[quadrantIndex];

        return (
          <ModuleSlot
            key={moduleKey ? `module-${moduleKey}` : `empty-${quadrantIndex}`}
            quadrantIndex={quadrantIndex}
            moduleKey={moduleKey}
            layout={layout}
            moduleSpans={moduleSpans}
            draggedModule={draggedModule}
            dragOverQuadrant={dragOverQuadrant}
            isDark={isDark}
            theme={theme}
            prefersReducedMotion={prefersReducedMotion}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleDragEnd={handleDragEnd}
            handleToggleExpand={handleToggleExpand}
            handleRemoveModule={handleRemoveModule}
            removeConfirmIndex={removeConfirmIndex}
            setRemoveConfirmIndex={setRemoveConfirmIndex}
            addMenuIndex={addMenuIndex}
            setAddMenuIndex={setAddMenuIndex}
            remainingModules={remainingModules}
            moduleTitleByKey={moduleTitleByKey}
            handleAddModule={handleAddModule}
            renderModule={renderModule}
            navigate={navigate}
          />
        );
      })}
    </motion.div>
  );
}
