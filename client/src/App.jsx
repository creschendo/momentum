import React, { useState, useEffect } from 'react';
import './index.css';
import ModuleCard from './components/ModuleCard';
import ModuleContainer from './components/ModuleContainer';
import AuthScreen from './components/AuthScreen';
import DashboardSummary from './components/DashboardSummary';
import nutrition from './modules/nutrition';
import fitness from './modules/fitness';
import productivity from './modules/productivity';
import pomodoro from './modules/pomodoro';
import NutritionModule from './modules/nutrition/NutritionModule';
import FitnessModule from './modules/fitness/FitnessModule';
import ProductivityModule from './modules/productivity/ProductivityModule';
import PomodoroModule from './modules/pomodoro/PomodoroModule';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  const { user, loading, logout } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const getOrdinalSuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const formattedDateTime = (() => {
    const weekday = currentDateTime.toLocaleDateString(undefined, { weekday: 'long' });
    const month = currentDateTime.toLocaleDateString(undefined, { month: 'long' });
    const day = currentDateTime.getDate();
    const time = currentDateTime
      .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      .toLowerCase();
    return `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}, ${time}`;
  })();
  
  // Ensures the dashboard grid always has valid row/slot structure.
  const normalizeLayout = (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return ['nutrition', 'productivity', 'fitness', null];
    }
    const next = [...value];
    if (next.length < 4) {
      while (next.length < 4) next.push(null);
    }
    if (next.length % 2 !== 0) {
      next.push(null);
    }
    return next;
  };

  // Load layout from localStorage or use default
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('module-layout');
    if (saved) {
      try {
        return normalizeLayout(JSON.parse(saved));
      } catch {
        return ['nutrition', 'productivity', 'fitness', null];
      }
    }
    return ['nutrition', 'productivity', 'fitness', null];
  });

  const [moduleSpans, setModuleSpans] = useState(() => {
    const saved = localStorage.getItem('module-spans');
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
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

  useEffect(() => {
    localStorage.setItem('module-spans', JSON.stringify(moduleSpans));
  }, [moduleSpans]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isCoveredSlot = (slots, spans, index) => {
    if (index % 2 === 0) return false;
    const leftModule = slots[index - 1];
    return !!leftModule && spans[leftModule] === 2;
  };

  const isAvailableSlot = (slots, spans, index) => {
    return slots[index] === null && !isCoveredSlot(slots, spans, index);
  };

  const ensureRowCapacity = (slots, minIndex) => {
    const next = [...slots];
    while (minIndex >= next.length) {
      next.push(null, null);
    }
    return next;
  };

  // Compacts modules after add/remove/drag while preserving span rules.
  const compactLayoutState = (slots, spans) => {
    const normalized = normalizeLayout(slots);
    const modulesInOrder = [];

    for (let i = 0; i < normalized.length; i += 1) {
      if (isCoveredSlot(normalized, spans, i)) continue;
      const moduleKey = normalized[i];
      if (moduleKey) {
        modulesInOrder.push(moduleKey);
      }
    }

    const presentModuleKeys = new Set(modulesInOrder);

    const sanitizedSpans = Object.fromEntries(
      Object.entries(spans).filter(([key, value]) => presentModuleKeys.has(key) && value === 2)
    );

    let compacted = Array.from({ length: Math.max(4, normalized.length) }, () => null);

    const findFirstFitIndex = (span) => {
      if (span === 2) {
        for (let i = 0; i < compacted.length; i += 2) {
          if (compacted[i] === null && compacted[i + 1] === null) {
            return i;
          }
        }
        compacted = [...compacted, null, null];
        return compacted.length - 2;
      }

      for (let i = 0; i < compacted.length; i += 1) {
        if (isAvailableSlot(compacted, sanitizedSpans, i)) return i;
      }

      compacted = [...compacted, null, null];
      return compacted.length - 2;
    };

    modulesInOrder.forEach((moduleKey) => {
      const span = sanitizedSpans[moduleKey] === 2 ? 2 : 1;
      const targetIndex = findFirstFitIndex(span);
      compacted[targetIndex] = moduleKey;
    });

    while (compacted.length > 4) {
      const lastRow = compacted.slice(-2);
      if (lastRow[0] === null && lastRow[1] === null) {
        compacted = compacted.slice(0, -2);
      } else {
        break;
      }
    }

    return {
      layout: normalizeLayout(compacted),
      spans: sanitizedSpans
    };
  };

  const applyLayoutState = (nextLayout, nextSpans) => {
    const compacted = compactLayoutState(nextLayout, nextSpans);
    setLayout(compacted.layout);
    setModuleSpans(compacted.spans);
  };

  const insertModuleAtIndex = (slots, moduleKey, insertIndex) => {
    let next = [...slots];
    let emptyIndex = next.indexOf(null, insertIndex);

    while (emptyIndex === -1) {
      next = [...next, null, null];
      emptyIndex = next.length - 2;
    }

    for (let i = emptyIndex; i > insertIndex; i -= 1) {
      next[i] = next[i - 1];
    }

    next[insertIndex] = moduleKey;
    return next;
  };
  
  const handleDragStart = (e, moduleKey) => {
    if (e.target !== e.currentTarget && e.target.draggable) {
      return;
    }
    setDraggedModule(moduleKey);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e, quadrantIndex) => {
    if (draggedModule === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverQuadrant(quadrantIndex);
  };
  
  const handleDragLeave = () => {
    setDragOverQuadrant(null);
  };
  
  // Swaps source/target modules and reapplies normalized layout state.
  const handleDrop = (e, targetQuadrantIndex) => {
    e.preventDefault();
    
    if (draggedModule === null) return;
    if (isCoveredSlot(layout, moduleSpans, targetQuadrantIndex)) return;
    
    // Find source quadrant
    const sourceQuadrantIndex = layout.indexOf(draggedModule);
    if (sourceQuadrantIndex === -1) return;
    
    // Create new layout
    const newLayout = [...layout];
    const nextSpans = { ...moduleSpans };

    const targetModule = newLayout[targetQuadrantIndex];

    // Collapse spans before swapping to avoid covered-slot conflicts
    if (nextSpans[draggedModule] === 2) {
      delete nextSpans[draggedModule];
    }
    if (targetModule && nextSpans[targetModule] === 2) {
      delete nextSpans[targetModule];
    }
    
    // Swap modules
    newLayout[targetQuadrantIndex] = draggedModule;
    newLayout[sourceQuadrantIndex] = targetModule;
    
    applyLayoutState(newLayout, nextSpans);
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
    if (isCoveredSlot(layout, moduleSpans, quadrantIndex)) return;

    const newLayout = [...layout];
    const moduleKey = newLayout[quadrantIndex];
    newLayout[quadrantIndex] = null;

    const nextSpans = { ...moduleSpans };
    if (moduleKey && nextSpans[moduleKey] === 2) {
      delete nextSpans[moduleKey];
    }

    applyLayoutState(newLayout, nextSpans);
    setRemoveConfirmIndex(null);
  };

  const handleAddModule = (quadrantIndex, moduleKey) => {
    if (isCoveredSlot(layout, moduleSpans, quadrantIndex)) return;

    const newLayout = [...layout];
    newLayout[quadrantIndex] = moduleKey;
    applyLayoutState(newLayout, { ...moduleSpans });
    setAddMenuIndex(null);
  };

  const handleStretchModule = (index) => {
    const moduleKey = layout[index];
    if (!moduleKey) return;

    let newLayout = normalizeLayout(layout);
    const rowStart = index % 2 === 0 ? index : index - 1;
    const rowEnd = rowStart + 1;
    const displacedModules = [];

    newLayout[index] = null;

    [rowStart, rowEnd].forEach((slotIndex) => {
      const occupyingModule = newLayout[slotIndex];
      if (occupyingModule && occupyingModule !== moduleKey) {
        displacedModules.push(occupyingModule);
      }
      newLayout[slotIndex] = null;
    });

    newLayout[rowStart] = moduleKey;

    displacedModules.forEach((displacedModule, offset) => {
      newLayout = insertModuleAtIndex(newLayout, displacedModule, rowEnd + 1 + offset);
    });

    const nextSpans = { [moduleKey]: 2 };

    applyLayoutState(newLayout, nextSpans);
    setAddMenuIndex(null);
    setRemoveConfirmIndex(null);
  };

  const handleCollapseModule = (moduleKey) => {
    if (!moduleSpans[moduleKey]) return;
    const nextSpans = { ...moduleSpans };
    delete nextSpans[moduleKey];
    applyLayoutState([...layout], nextSpans);
  };

  const handleToggleExpand = (index) => {
    const moduleKey = layout[index];
    if (!moduleKey) return;

    if (moduleSpans[moduleKey] === 2) {
      handleCollapseModule(moduleKey);
      return;
    }

    handleStretchModule(index);
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

  if (loading) {
    return (
      <div className="app-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg, color: theme.text }}>
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 20px', gap: 12 }}>
          <div style={{ justifySelf: 'start' }}>
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
            </div>
          </div>
          <div
            style={{
              justifySelf: 'center',
              fontSize: 30,
              fontWeight: 600,
              color: theme.text,
              letterSpacing: '0.2px',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
            aria-live="polite"
          >
            {formattedDateTime}
          </div>
          <div style={{ position: 'relative', justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={logout}
              style={{
                padding: '10px 12px',
                backgroundColor: theme.bgTertiary,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
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

      <main style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 32 }}>
          <DashboardSummary />
        </div>
        <div
          className="module-grid"
          onClick={() => {
            if (addMenuIndex !== null) {
              setAddMenuIndex(null);
            }
          }}
        >
          {layout.map((_, quadrantIndex) => {
            if (isCoveredSlot(layout, moduleSpans, quadrantIndex)) {
              return null;
            }

            const moduleKey = layout[quadrantIndex];
            const isDraggingOver = draggedModule !== null && dragOverQuadrant === quadrantIndex;
            const isDragging = draggedModule === moduleKey;
            const isSpanned = !!moduleKey && moduleSpans[moduleKey] === 2 && quadrantIndex % 2 === 0;
            
            return (
              <div
                key={moduleKey ? `module-${moduleKey}-${quadrantIndex}` : `empty-${quadrantIndex}`}
                className="module-card"
                style={{
                  gridColumn: isSpanned ? 'span 2' : 'auto',
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
