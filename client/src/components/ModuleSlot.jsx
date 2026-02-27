import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { popoverTransition, staggerItem } from '../motion/presets';
import { MODULE_ROUTE_MAP } from '../utils/moduleHelpers';
import ErrorBoundary from './ErrorBoundary';

export default function ModuleSlot({
  quadrantIndex,
  moduleKey,
  layout,
  moduleSpans,
  draggedModule,
  dragOverQuadrant,
  isDark,
  theme,
  prefersReducedMotion,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleToggleExpand,
  handleRemoveModule,
  removeConfirmIndex,
  setRemoveConfirmIndex,
  addMenuIndex,
  setAddMenuIndex,
  remainingModules,
  moduleTitleByKey,
  handleAddModule,
  renderModule,
  navigate
}) {
  const isDraggingOver = draggedModule !== null && dragOverQuadrant === quadrantIndex;
  const isDragging = draggedModule === moduleKey;
  const isSpanned = !!moduleKey && moduleSpans[moduleKey] === 2 && quadrantIndex % 2 === 0;

  return (
    <motion.div
      key={moduleKey ? `module-${moduleKey}` : `empty-${quadrantIndex}`}
      className="module-card"
      layout={prefersReducedMotion ? false : true}
      initial={prefersReducedMotion ? false : { opacity: 0.96, scale: 0.995 }}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              opacity: isDragging ? 0.4 : 1,
              scale: isDragging ? 0.995 : 1
            }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : {
              layout: {
                type: 'spring',
                stiffness: 240,
                damping: 28,
                mass: 0.9
              },
              opacity: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
            }
      }
      variants={prefersReducedMotion ? undefined : staggerItem}
      whileHover={moduleKey ? { y: -2 } : undefined}
      style={{
        gridColumn: isSpanned ? 'span 2' : 'auto',
        border: isDraggingOver ? `2px dashed ${theme.primary}` : `1px solid ${isDark ? theme.border : theme.borderLight}`,
        backgroundColor: isDraggingOver ? theme.bgTertiary : theme.bgSecondary,
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 28,
        cursor: moduleKey ? 'grab' : 'default',
        position: 'relative'
      }}
      draggable={!!moduleKey}
      onDragStart={(e) => handleDragStart(e, moduleKey)}
      onDragOver={(e) => handleDragOver(e, quadrantIndex)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, quadrantIndex)}
      onDragEnd={handleDragEnd}
    >
      {moduleKey ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(MODULE_ROUTE_MAP[moduleKey] || '/');
            }}
            style={{
              position: 'absolute',
              top: 8,
              left: 34,
              backgroundColor: 'transparent',
              color: theme.textMuted,
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              lineHeight: 1,
              width: 20,
              height: 20,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={`Open ${moduleTitleByKey[moduleKey] || moduleKey} page`}
          >
            ↗
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRemoveConfirmIndex(quadrantIndex);
              setAddMenuIndex(null);
            }}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 11,
              height: 15,
              borderRadius: 6,
              backgroundColor: 'transparent',
              color: 'white',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Remove module"
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>−</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand(quadrantIndex);
            }}
            style={{
              position: 'absolute',
              top: 8,
              left: 10,
              backgroundColor: 'transparent',
              color: theme.text,
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              width: 20,
              height: 20,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={moduleSpans[moduleKey] === 2 ? 'Compress module' : 'Expand module'}
          >
            {moduleSpans[moduleKey] === 2 ? '⤡' : '⤢'}
          </button>
          <ErrorBoundary
            fallback={(
              <div
                style={{
                  marginTop: 16,
                  marginInline: 12,
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${theme.error}`,
                  backgroundColor: theme.errorBg,
                  color: theme.text,
                  fontSize: 13
                }}
              >
                This module failed to render. Try refreshing the page.
              </div>
            )}
            onError={(error) => {
              console.error(`Module render error (${moduleKey})`, error);
            }}
          >
            {renderModule(moduleKey)}
          </ErrorBoundary>
          <AnimatePresence>
            {removeConfirmIndex === quadrantIndex && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={popoverTransition}
                style={{
                  position: 'absolute',
                  top: 40,
                  right: 10,
                  backgroundColor: theme.bg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  zIndex: 2,
                  minWidth: 160
                }}
              >
                <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>Remove module?</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRemoveConfirmIndex(null);
                    }}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: theme.bgTertiary,
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveModule(quadrantIndex);
                    }}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: '#e11d48',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (isDraggingOver) return;
            setAddMenuIndex(quadrantIndex);
            setRemoveConfirmIndex(null);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.textMuted,
            fontSize: '14px',
            cursor: isDraggingOver ? 'default' : 'pointer'
          }}
        >
          {isDraggingOver ? (
            'Drop here'
          ) : (
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddMenuIndex(quadrantIndex);
                  setRemoveConfirmIndex(null);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'transparent',
                  color: isDark ? 'white' : theme.textMuted,
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                aria-label="Add module"
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
              </button>
              <AnimatePresence>
                {addMenuIndex === quadrantIndex && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, x: '-50%', scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                    exit={{ opacity: 0, y: -6, x: '-50%', scale: 0.98 }}
                    transition={popoverTransition}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 40,
                      left: '50%',
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      zIndex: 2,
                      minWidth: 180
                    }}
                  >
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>Add module</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {remainingModules.length === 0 ? (
                        <div style={{ fontSize: 12, color: theme.textMuted }}>No modules available</div>
                      ) : (
                        remainingModules.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddModule(quadrantIndex, key);
                            }}
                            style={{
                              padding: '6px 8px',
                              backgroundColor: theme.primaryDark,
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            {moduleTitleByKey[key] || key}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
