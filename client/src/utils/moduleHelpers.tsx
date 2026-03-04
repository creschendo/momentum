import React from 'react';
import nutrition from '../modules/nutrition';
import fitness from '../modules/fitness';
import productivity from '../modules/productivity';
import pomodoro from '../modules/pomodoro';
import sleep from '../modules/sleep';

export const MODULES = [nutrition, productivity, fitness, sleep, pomodoro];

export const MODULE_ROUTE_MAP = {
  nutrition: '/nutrition',
  productivity: '/productivity',
  fitness: '/fitness',
  sleep: '/sleep',
  pomodoro: '/pomodoro'
};

export function getOrdinalSuffix(day) {
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
}

export function getThemeIcon(themeName, color) {
  switch (themeName) {
    case 'night':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      );
    case 'cove':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8 Q5 5, 8 8 Q11 11, 14 8 Q17 5, 22 8" />
          <path d="M2 14 Q5 11, 8 14 Q11 17, 14 14 Q17 11, 22 14" />
          <path d="M2 20 Q5 17, 8 20 Q11 23, 14 20 Q17 17, 22 20" />
        </svg>
      );
    case 'glade':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 L6 12 h4 L4 21 h16 L14 12 h4 Z" />
          <line x1="12" y1="21" x2="12" y2="23" />
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
