import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer } from '../motion/presets';
import ModuleSlot from './ModuleSlot';

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
}) {
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
