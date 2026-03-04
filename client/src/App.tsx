import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './index.css';

import AuthScreen from './components/AuthScreen';
import DashboardSummary from './components/DashboardSummary';
import DashboardHeader from './components/DashboardHeader';
import DashboardGrid from './components/DashboardGrid';
import ErrorBoundary from './components/ErrorBoundary';

import NutritionModule from './modules/nutrition/NutritionModule';
import FitnessModule from './modules/fitness/FitnessModule';
import ProductivityModule from './modules/productivity/ProductivityModule';
import PomodoroModule from './modules/pomodoro/PomodoroModule';
import SleepModule from './modules/sleep/SleepModule';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fadeIn, fadeInUp } from './motion/presets';
import useClock from './hooks/useClock';
import useLayout from './hooks/useLayout';

function AppContent() {
  const { theme, currentTheme, isDark } = useTheme();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const { formattedDateTime } = useClock();
  const layoutState = useLayout();
  const coveAccentWhite = '#ffffff';

  const renderModule = (moduleKey) => {
    if (!moduleKey) return null;
    if (moduleKey === 'nutrition') return <NutritionModule />;
    if (moduleKey === 'fitness') return <FitnessModule />;
    if (moduleKey === 'productivity') return <ProductivityModule />;
    if (moduleKey === 'sleep') return <SleepModule />;
    if (moduleKey === 'pomodoro') return <PomodoroModule />;
    return null;
  };

  const rootMotionProps = prefersReducedMotion
    ? {}
    : { variants: fadeIn, initial: 'hidden', animate: 'show' };

  const sectionMotionProps = prefersReducedMotion
    ? {}
    : { variants: fadeInUp, initial: 'hidden', animate: 'show' };

  if (loading) {
    return (
      <div
        className="app-root"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.bg,
          color: theme.text
        }}
      >
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const moduleRouteContent = (moduleKey) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            padding: '8px 12px',
            backgroundColor: theme.bgTertiary,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          ← Dashboard
        </button>
      </div>
      {renderModule(moduleKey)}
    </div>
  );

  return (
    <motion.div
      className="app-root"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        transition: 'all 200ms',
        '--bg-secondary': theme.bgSecondary,
        '--border': theme.border,
        '--border-light': theme.borderLight,
        '--module-hover-outline':
          currentTheme === 'cove'
            ? coveAccentWhite
            : currentTheme === 'night'
              ? 'rgba(255, 255, 255, 0.55)'
              : theme.borderLight,
        '--grid-line': isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(17, 24, 39, 0.06)'
      }}
      {...rootMotionProps}
    >
      <DashboardHeader
        formattedDateTime={formattedDateTime}
        onLogout={logout}
        sectionMotionProps={sectionMotionProps}
      />

      <main style={{ marginTop: 32 }}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <motion.div style={{ marginBottom: 32 }} {...sectionMotionProps}>
                  <DashboardSummary />
                </motion.div>
                <DashboardGrid
                  layout={layoutState.layout}
                  moduleSpans={layoutState.moduleSpans}
                  draggedModule={layoutState.draggedModule}
                  dragOverQuadrant={layoutState.dragOverQuadrant}
                  addMenuIndex={layoutState.addMenuIndex}
                  setAddMenuIndex={layoutState.setAddMenuIndex}
                  removeConfirmIndex={layoutState.removeConfirmIndex}
                  setRemoveConfirmIndex={layoutState.setRemoveConfirmIndex}
                  isCoveredSlot={layoutState.isCoveredSlot}
                  handleDragStart={layoutState.handleDragStart}
                  handleDragOver={layoutState.handleDragOver}
                  handleDragLeave={layoutState.handleDragLeave}
                  handleDrop={layoutState.handleDrop}
                  handleDragEnd={layoutState.handleDragEnd}
                  handleToggleExpand={layoutState.handleToggleExpand}
                  handleRemoveModule={layoutState.handleRemoveModule}
                  handleAddModule={layoutState.handleAddModule}
                  remainingModules={layoutState.remainingModules}
                  moduleTitleByKey={layoutState.moduleTitleByKey}
                  renderModule={renderModule}
                  navigate={navigate}
                  theme={theme}
                  isDark={isDark}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </>
            }
          />
          <Route path="/nutrition" element={moduleRouteContent('nutrition')} />
          <Route path="/productivity" element={moduleRouteContent('productivity')} />
          <Route path="/fitness" element={moduleRouteContent('fitness')} />
          <Route path="/sleep" element={moduleRouteContent('sleep')} />
          <Route path="/pomodoro" element={moduleRouteContent('pomodoro')} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </motion.div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary
          fallback={(
            <div
              className="app-root"
              style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                textAlign: 'center'
              }}
            >
              Something went wrong while rendering the app. Please refresh.
            </div>
          )}
          onError={(error) => {
            console.error('App render error', error);
          }}
        >
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}
