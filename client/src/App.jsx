import React, { useState, useEffect } from 'react';
import './index.css';
import ModuleCard from './components/ModuleCard';
import ModuleContainer from './components/ModuleContainer';
import nutrition from './modules/nutrition';
import fitness from './modules/fitness';
import productivity from './modules/productivity';
import pomodoro from './modules/pomodoro';
import NutritionModule from './modules/nutrition/NutritionModule';
import FitnessModule from './modules/fitness/FitnessModule';
import ProductivityModule from './modules/productivity/ProductivityModule';
import PomodoroModule from './modules/pomodoro/PomodoroModule';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const MODULES = [nutrition, productivity, fitness, pomodoro];

function AppContent() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  // Load layout from localStorage or use default
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('module-layout');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default layout: [quadrant1, quadrant2, quadrant3, quadrant4]
    return ['nutrition', 'productivity', 'fitness', null];
  });

  const [draggedModule, setDraggedModule] = useState(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState(null);
  const [removeConfirmIndex, setRemoveConfirmIndex] = useState(null);
  const [addMenuIndex, setAddMenuIndex] = useState(null);
  
  // Save layout to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('module-layout', JSON.stringify(layout));
  }, [layout]);
  
  const handleDragStart = (e, moduleKey) => {
    setDraggedModule(moduleKey);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e, quadrantIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverQuadrant(quadrantIndex);
  };
  
  const handleDragLeave = () => {
    setDragOverQuadrant(null);
  };
  
  const handleDrop = (e, targetQuadrantIndex) => {
    e.preventDefault();
    
    if (draggedModule === null) return;
    
    // Find source quadrant
    const sourceQuadrantIndex = layout.indexOf(draggedModule);
    
    // Create new layout
    const newLayout = [...layout];
    
    // Swap modules
    const targetModule = newLayout[targetQuadrantIndex];
    newLayout[targetQuadrantIndex] = draggedModule;
    if (sourceQuadrantIndex !== -1) {
      newLayout[sourceQuadrantIndex] = targetModule;
    }
    
    setLayout(newLayout);
    setDraggedModule(null);
    setDragOverQuadrant(null);
    setAddMenuIndex(null);
    setRemoveConfirmIndex(null);
  };
  
  const handleDragEnd = () => {
    setDraggedModule(null);
    setDragOverQuadrant(null);
  };

  const handleRemoveModule = (quadrantIndex) => {
    const newLayout = [...layout];
    newLayout[quadrantIndex] = null;
    setLayout(newLayout);
    setRemoveConfirmIndex(null);
  };

  const handleAddModule = (quadrantIndex, moduleKey) => {
    const newLayout = [...layout];
    newLayout[quadrantIndex] = moduleKey;
    setLayout(newLayout);
    setAddMenuIndex(null);
  };

  const allModuleKeys = MODULES.map((m) => m.key);
  const remainingModules = allModuleKeys.filter((key) => !layout.includes(key));
  const moduleTitleByKey = MODULES.reduce((acc, m) => {
    acc[m.key] = m.title;
    return acc;
  }, {});
  
  const renderModule = (moduleKey) => {
    if (!moduleKey) return null;
    
    if (moduleKey === 'nutrition') {
      return <NutritionModule />;
    } else if (moduleKey === 'fitness') {
      return <FitnessModule />;
    } else if (moduleKey === 'productivity') {
      return <ProductivityModule />;
    } else if (moduleKey === 'pomodoro') {
      return <PomodoroModule />;
    }
    return null;
  };

  return (
    <div 
      className="app-root" 
      style={{ 
        backgroundColor: theme.bg, 
        color: theme.text, 
        transition: 'all 200ms',
        '--bg-secondary': theme.bgSecondary,
        '--border': theme.border,
        '--border-light': theme.borderLight
      }}
    >
      <header style={{ backgroundColor: theme.bgSecondary, borderBottom: `1px solid ${theme.border}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{ backgroundColor: theme.bgSecondary, padding: '16px', borderRadius: '8px' }}>
                <svg width="80" height="80" viewBox="0 0 200 200" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                  {isDark ? (
                    <>
                      {/* Dark Mode - Inverted M */}
                      {/* Dark background with rounded corners */}
                      <rect x="40" y="40" width="120" height="120" rx="24" fill="#1a1a1a" />
                      {/* White M cutout */}
                      <path
                        d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z"
                        fill="white"
                      />
                      {/* Blue accent at top */}
                      <rect x="40" y="40" width="120" height="8" rx="24" fill="#0066FF" />
                    </>
                  ) : (
                    <>
                      {/* Light Mode - Inverted Geometric M */}
                      {/* Blue background square */}
                      <rect x="40" y="40" width="120" height="120" fill="#0066FF" />
                      {/* White M cutout */}
                      <path
                        d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z"
                        fill="white"
                      />
                    </>
                  )}
                </svg>
              </div>
              <h1 style={{ margin: 3, marginTop: 8, marginBottom: 12, color: theme.text }}>Momentum</h1>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.primaryDark,
              color: '#ffffff',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 200ms'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.primaryDark;
            }}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.9" y1="4.9" x2="6.3" y2="6.3" />
                <line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
                <line x1="4.9" y1="19.1" x2="6.3" y2="17.7" />
                <line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main>
        <div
          className="module-grid"
          onClick={() => {
            if (addMenuIndex !== null) {
              setAddMenuIndex(null);
            }
          }}
        >
          {[0, 1, 2, 3].map((quadrantIndex) => {
            const moduleKey = layout[quadrantIndex];
            const isDraggingOver = dragOverQuadrant === quadrantIndex;
            const isDragging = draggedModule === moduleKey;
            
            return (
              <div
                key={quadrantIndex}
                className="module-card"
                style={{
                  opacity: isDragging ? 0.4 : 1,
                  border: isDraggingOver 
                    ? `2px dashed ${theme.primary}` 
                    : `1px solid ${isDark ? theme.border : theme.borderLight}`,
                  backgroundColor: isDraggingOver 
                    ? theme.bgTertiary 
                    : theme.bgSecondary,
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
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 12,
                        height: 18,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'grab'
                      }}
                      aria-hidden="true"
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>⋮⋮</span>
                    </div>
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
                    {renderModule(moduleKey)}
                    {removeConfirmIndex === quadrantIndex && (
                      <div
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
                        <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>
                          Remove module?
                        </div>
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
                      </div>
                    )}
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
                        {addMenuIndex === quadrantIndex && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: 40,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: theme.bg,
                              border: `1px solid ${theme.border}`,
                              borderRadius: 8,
                              padding: 10,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                              zIndex: 2,
                              minWidth: 180
                            }}
                          >
                            <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>
                              Add module
                            </div>
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
