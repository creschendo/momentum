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

function getThemeIcon(themeName, color) {
  switch (themeName) {
    case 'light':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      );
    case 'dark':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      );
    case 'forest':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 12h3v8h5v-5h4v5h5v-8h3L12 2z" />
          <line x1="12" y1="20" x2="12" y2="22" />
        </svg>
      );
    case 'ember':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 0 20" />
        </svg>
      );
  }
}

function AppContent() {
  const { theme, currentTheme, isDark, setTheme } = useTheme();
  
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
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  
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
                  {currentTheme === 'light' ? (
                    <>
                      {/* Light Mode - Blue background with white M */}
                      <rect x="40" y="40" width="120" height="120" fill="#0066FF" />
                      <path
                        d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z"
                        fill="white"
                      />
                    </>
                  ) : currentTheme === 'dark' ? (
                    <>
                      {/* Dark Mode - Dark background with white M and blue accent */}
                      <rect x="40" y="40" width="120" height="120" rx="24" fill="#1a1a1a" />
                      <path
                        d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z"
                        fill="white"
                      />
                      <rect x="40" y="40" width="120" height="8" rx="24" fill="#60a5fa" />
                    </>
                  ) : currentTheme === 'forest' ? (
                    <>
                      {/* Forest Mode - Dark green background with white M and green accent */}
                      <rect x="40" y="40" width="120" height="120" rx="24" fill="#0a1f0f" />
                      <path
                        d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z"
                        fill="white"
                      />
                      <rect x="40" y="40" width="120" height="8" rx="24" fill="#4ade80" />
                    </>
                  ) : currentTheme === 'ember' ? (
                    <>
                      {/* Ember Mode - Dark red background with white M and red accent */}
                      <rect x="40" y="40" width="120" height="120" rx="24" fill="#1a0505" />
                      <path
                        d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z"
                        fill="white"
                      />
                      <rect x="40" y="40" width="120" height="8" rx="24" fill="#ff4433" />
                    </>
                  ) : (
                    <>
                      {/* Default - Dark background with white M */}
                      <rect x="40" y="40" width="120" height="120" rx="24" fill="#1a1a1a" />
                      <path
                        d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z"
                        fill="white"
                      />
                    </>
                  )}
                </svg>
              </div>
              <h1 style={{ margin: 3, marginTop: 8, marginBottom: 12, color: theme.text }}>MMTM</h1>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              aria-label="Select theme"
              style={{
                padding: '10px 36px 10px 36px',
                backgroundColor: theme.bgTertiary,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                fontFamily: 'inherit',
                boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`,
                minWidth: '140px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.bgSecondary;
                e.currentTarget.style.borderColor = theme.borderLight;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 12px rgba(0, 0, 0, ${isDark ? '0.4' : '0.15'})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.bgTertiary;
                e.currentTarget.style.borderColor = theme.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`;
              }}
            >
              {getThemeIcon(currentTheme, theme.textMuted)}
              <span style={{ flex: 1, textAlign: 'left' }}>
                {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
              </span>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={theme.textMuted} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  transform: themeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease'
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {themeDropdownOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999
                  }}
                  onClick={() => setThemeDropdownOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '140px',
                    backgroundColor: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    boxShadow: `0 8px 24px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'}), 0 2px 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`,
                    zIndex: 1000,
                    overflow: 'hidden',
                    padding: '6px'
                  }}
                >
                  {['light', 'dark', 'forest', 'ember'].map((themeName) => (
                    <button
                      key={themeName}
                      onClick={() => {
                        setTheme(themeName);
                        setThemeDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: currentTheme === themeName ? theme.bgTertiary : 'transparent',
                        color: theme.text,
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: currentTheme === themeName ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: themeName === 'ember' ? 0 : '2px'
                      }}
                      onMouseEnter={(e) => {
                        if (currentTheme !== themeName) {
                          e.currentTarget.style.backgroundColor = theme.bgTertiary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentTheme !== themeName) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {getThemeIcon(themeName, theme.text)}
                      <span>{themeName.charAt(0).toUpperCase() + themeName.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
