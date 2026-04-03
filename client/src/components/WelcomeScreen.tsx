import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import * as authApi from '../api/auth';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const TOTAL_STEPS = 6;

// ── Goal definitions ──────────────────────────────────────────────────────────

const GOALS = [
  {
    key: 'lose-weight',
    label: 'Lose Weight',
    desc: 'Burn fat, track calories',
    defaultModules: ['nutrition', 'fitness', 'sleep'],
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    )
  },
  {
    key: 'build-muscle',
    label: 'Build Muscle',
    desc: 'Gain strength, eat enough',
    defaultModules: ['fitness', 'nutrition', 'productivity'],
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11" /><path d="M6.5 17.5h11" />
        <path d="M3 9.5h3v5H3z" /><path d="M18 9.5h3v5h-3z" />
        <path d="M6.5 9.5v5" /><path d="M17.5 9.5v5" />
      </svg>
    )
  },
  {
    key: 'eat-better',
    label: 'Eat Better',
    desc: 'Improve nutrition habits',
    defaultModules: ['nutrition', 'sleep', 'notes'],
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 8v4l3 3" />
        <path d="M18 2v6" /><path d="M21 5H15" />
      </svg>
    )
  },
  {
    key: 'sleep-better',
    label: 'Sleep Better',
    desc: 'Rest, recover, recharge',
    defaultModules: ['sleep', 'productivity', 'pomodoro'],
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    )
  },
  {
    key: 'be-productive',
    label: 'Be Productive',
    desc: 'Focus, plan, achieve',
    defaultModules: ['productivity', 'pomodoro', 'notes'],
    icon: (color: string) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    )
  }
];

// ── Module definitions ────────────────────────────────────────────────────────

const ALL_MODULES = [
  {
    key: 'nutrition',
    label: 'Nutrition',
    desc: 'Track meals, calories & macros',
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    )
  },
  {
    key: 'fitness',
    label: 'Fitness',
    desc: 'Log workouts & track progress',
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11" /><path d="M6.5 17.5h11" />
        <path d="M3 9.5h3v5H3z" /><path d="M18 9.5h3v5h-3z" />
        <path d="M6.5 9.5v5" /><path d="M17.5 9.5v5" />
      </svg>
    )
  },
  {
    key: 'productivity',
    label: 'Productivity',
    desc: 'Tasks, habits & daily planning',
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    )
  },
  {
    key: 'sleep',
    label: 'Sleep',
    desc: 'Log sleep & track patterns',
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    )
  },
  {
    key: 'pomodoro',
    label: 'Pomodoro',
    desc: 'Focus sessions with intervals',
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    )
  },
  {
    key: 'notes',
    label: 'Notes',
    desc: 'Quick notes & journaling',
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    )
  }
];

const ACTIVITY_LEVELS = [
  { value: 1.375, label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 1.55, label: 'Lightly Active', desc: '1–3 days of exercise per week' },
  { value: 1.725, label: 'Moderately Active', desc: '3–5 days of exercise per week' },
  { value: 1.9, label: 'Very Active', desc: '6–7 days of exercise per week' }
];

// ── BMR estimate ──────────────────────────────────────────────────────────────

function estimateTDEE(sex: string, heightCm: number, weightKg: number, dob: string, activity: number): number | null {
  if (!sex || !heightCm || !weightKg || !dob) return null;
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age < 10 || age > 120) return null;
  const bmr = sex === 'female'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr * activity);
}

// ── Slide animation variants ──────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.26, ease: EASE_OUT } },
  exit: (dir: number) => ({ x: dir > 0 ? -36 : 36, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } })
};

// ── Form state ────────────────────────────────────────────────────────────────

interface FormData {
  goal: string;
  dob: string;
  sex: string;
  heightCm: string;
  weightKg: string;
  activityLevel: number;
  modules: string[];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface WelcomeScreenProps {
  onComplete: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormData>({
    goal: '',
    dob: '',
    sex: 'male',
    heightCm: '',
    weightKg: '',
    activityLevel: 1.55,
    modules: []
  });

  const motionProps = prefersReducedMotion
    ? {}
    : { variants: slideVariants, custom: dir, initial: 'enter', animate: 'center', exit: 'exit' };

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goTo(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function handleGoalSelect(goalKey: string) {
    const goal = GOALS.find(g => g.key === goalKey)!;
    setForm(f => ({ ...f, goal: goalKey, modules: goal.defaultModules }));
    goTo(2);
  }

  function handleActivitySelect(value: number) {
    setForm(f => ({ ...f, activityLevel: value }));
    goTo(4);
  }

  function toggleModule(key: string) {
    setForm(f => ({
      ...f,
      modules: f.modules.includes(key)
        ? f.modules.filter(m => m !== key)
        : [...f.modules, key]
    }));
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const profileUpdate: Parameters<typeof authApi.updateProfile>[0] = {};
      if (form.dob) profileUpdate.dateOfBirth = form.dob;
      if (form.sex) profileUpdate.sex = form.sex;
      if (form.heightCm) profileUpdate.heightCm = Number(form.heightCm);
      if (Object.keys(profileUpdate).length > 0) {
        await authApi.updateProfile(profileUpdate);
      }

      // Set dashboard layout from selected modules (first 4 → 4 slots)
      const ordered = ALL_MODULES.map(m => m.key).filter(k => form.modules.includes(k));
      const layout: (string | null)[] = ordered.slice(0, 4);
      while (layout.length < 4) layout.push(null);
      localStorage.setItem('module-layout', JSON.stringify(layout));

      localStorage.removeItem('momentum-onboarding-pending');
      onComplete();
    } catch {
      // Non-fatal — proceed anyway
      localStorage.removeItem('momentum-onboarding-pending');
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    localStorage.removeItem('momentum-onboarding-pending');
    onComplete();
  }

  // ── Shared styles ───────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    border: `1px solid ${theme.border}`,
    borderRadius: 7,
    backgroundColor: theme.bgTertiary,
    color: theme.text,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: theme.textMuted,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const tdee = estimateTDEE(
    form.sex,
    Number(form.heightCm),
    Number(form.weightKg),
    form.dob,
    form.activityLevel
  );

  const dashboardModules = ALL_MODULES.map(m => m.key).filter(k => form.modules.includes(k)).slice(0, 4);

  // ── Slides ──────────────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {

      // Slide 0 — Welcome
      case 0:
        return (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              backgroundColor: theme.primaryLight,
              border: `1px solid ${theme.primary}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 700, color: theme.text }}>
              Welcome to Momentum
            </h2>
            <p style={{ margin: '0 0 28px', fontSize: 15, color: theme.textMuted, lineHeight: 1.6 }}>
              Let's take two minutes to set up your dashboard.<br />
              You can always adjust everything later.
            </p>
            <button
              onClick={() => goTo(1)}
              style={{
                width: '100%', padding: '11px 0',
                backgroundColor: theme.primary, color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Get Started
            </button>
          </div>
        );

      // Slide 1 — Goal
      case 1:
        return (
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: theme.text }}>
              What's your main goal?
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: theme.textMuted }}>
              We'll pre-select the modules that fit best.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GOALS.map(goal => {
                const selected = form.goal === goal.key;
                return (
                  <button
                    key={goal.key}
                    onClick={() => handleGoalSelect(goal.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      backgroundColor: selected ? theme.primaryLight : theme.bgTertiary,
                      border: `1px solid ${selected ? theme.primary : theme.border}`,
                      borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 120ms, background-color 120ms'
                    }}
                    onMouseEnter={e => {
                      if (!selected) e.currentTarget.style.borderColor = theme.borderLight;
                    }}
                    onMouseLeave={e => {
                      if (!selected) e.currentTarget.style.borderColor = theme.border;
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      backgroundColor: selected ? theme.primary : theme.border,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background-color 120ms'
                    }}>
                      {goal.icon(selected ? '#fff' : theme.textMuted)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{goal.label}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{goal.desc}</div>
                    </div>
                    {selected && (
                      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // Slide 2 — Body stats
      case 2:
        return (
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: theme.text }}>
              A few quick numbers
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: theme.textMuted }}>
              Used to estimate your daily calorie target. All optional.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Date of birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Sex</label>
                <select
                  value={form.sex}
                  onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                  className="minimal-select"
                  style={{ ...inputStyle }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Height (cm)</label>
                <input
                  type="number"
                  className="no-spin"
                  value={form.heightCm}
                  onChange={e => setForm(f => ({ ...f, heightCm: e.target.value }))}
                  placeholder="e.g. 175"
                  min={100} max={250}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Weight (kg)</label>
                <input
                  type="number"
                  className="no-spin"
                  value={form.weightKg}
                  onChange={e => setForm(f => ({ ...f, weightKg: e.target.value }))}
                  placeholder="e.g. 75"
                  min={30} max={300}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        );

      // Slide 3 — Activity level
      case 3:
        return (
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: theme.text }}>
              How active are you?
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: theme.textMuted }}>
              Helps fine-tune your calorie estimate.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACTIVITY_LEVELS.map(level => {
                const selected = form.activityLevel === level.value;
                return (
                  <button
                    key={level.value}
                    onClick={() => handleActivitySelect(level.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      backgroundColor: selected ? theme.primaryLight : theme.bgTertiary,
                      border: `1px solid ${selected ? theme.primary : theme.border}`,
                      borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 120ms, background-color 120ms'
                    }}
                    onMouseEnter={e => {
                      if (!selected) e.currentTarget.style.borderColor = theme.borderLight;
                    }}
                    onMouseLeave={e => {
                      if (!selected) e.currentTarget.style.borderColor = theme.border;
                    }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: selected ? theme.primary : theme.border,
                      boxShadow: selected ? `0 0 0 3px ${theme.primaryLight}` : 'none',
                      transition: 'background-color 120ms'
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{level.label}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{level.desc}</div>
                    </div>
                    {selected && (
                      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // Slide 4 — Module picker
      case 4:
        return (
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: theme.text }}>
              Pick your modules
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: theme.textMuted }}>
              The first four go on your dashboard. You can rearrange them later.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ALL_MODULES.map(mod => {
                const checked = form.modules.includes(mod.key);
                const dashboardRank = dashboardModules.indexOf(mod.key);
                const onDashboard = dashboardRank !== -1;
                return (
                  <button
                    key={mod.key}
                    onClick={() => toggleModule(mod.key)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      gap: 6, padding: '12px 12px',
                      backgroundColor: checked ? theme.primaryLight : theme.bgTertiary,
                      border: `1px solid ${checked ? theme.primary : theme.border}`,
                      borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 120ms, background-color 120ms',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      if (!checked) e.currentTarget.style.borderColor = theme.borderLight;
                    }}
                    onMouseLeave={e => {
                      if (!checked) e.currentTarget.style.borderColor = theme.border;
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      {mod.icon(checked ? theme.primary : theme.textMuted)}
                      {onDashboard && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          backgroundColor: theme.primary, color: '#fff',
                          borderRadius: 4, padding: '1px 5px',
                          lineHeight: '16px'
                        }}>
                          {dashboardRank + 1}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{mod.label}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.4 }}>{mod.desc}</div>
                  </button>
                );
              })}
            </div>
            {form.modules.length > 4 && (
              <p style={{ margin: '10px 0 0', fontSize: 12, color: theme.textMuted }}>
                Modules 5+ will be available to add from your dashboard.
              </p>
            )}
          </div>
        );

      // Slide 5 — Summary
      case 5:
        return (
          <div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: theme.primaryLight,
              border: `1px solid ${theme.primary}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: theme.text }}>
              You're all set
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: theme.textMuted }}>
              Here's a preview of your personalised dashboard.
            </p>

            {tdee && (
              <div style={{
                padding: '14px 16px', borderRadius: 9,
                backgroundColor: theme.bgTertiary,
                border: `1px solid ${theme.border}`,
                marginBottom: 12
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Estimated daily calories
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.primary }}>
                  {tdee.toLocaleString()}
                  <span style={{ fontSize: 13, fontWeight: 400, color: theme.textMuted, marginLeft: 6 }}>kcal / day</span>
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                  Based on your stats and activity level. Fine-tune in the BMR Calculator.
                </div>
              </div>
            )}

            <div style={{
              padding: '14px 16px', borderRadius: 9,
              backgroundColor: theme.bgTertiary,
              border: `1px solid ${theme.border}`,
              marginBottom: 20
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Dashboard modules
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {dashboardModules.length > 0
                  ? dashboardModules.map((key, i) => {
                      const mod = ALL_MODULES.find(m => m.key === key)!;
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: 4,
                            backgroundColor: theme.primary, color: '#fff',
                            fontSize: 10, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>{i + 1}</span>
                          {mod.icon(theme.textSecondary)}
                          <span style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>{mod.label}</span>
                        </div>
                      );
                    })
                  : <div style={{ fontSize: 13, color: theme.textMuted }}>No modules selected — you can add them from the dashboard.</div>
                }
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={saving}
              style={{
                width: '100%', padding: '11px 0',
                backgroundColor: saving ? theme.border : theme.primary, color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Saving…' : 'Go to Dashboard'}
            </button>
          </div>
        );

      default:
        return null;
    }
  }

  // ── Can go next (for slides that need a value) ──────────────────────────────

  const canGoNext = (() => {
    if (step === 1) return !!form.goal;
    return true;
  })();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="app-root"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        color: theme.text,
        padding: 20
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 3, borderRadius: 99,
                backgroundColor: i <= step ? theme.primary : theme.border,
                transition: 'background-color 300ms'
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          padding: 28,
          overflow: 'hidden',
          boxShadow: `0 8px 32px rgba(0,0,0,0.3)`
        }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} {...motionProps}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {step > 0 && step < 5 && (
          <div style={{
            display: 'flex',
            justifyContent: step === 1 ? 'flex-start' : 'space-between',
            alignItems: 'center',
            marginTop: 14,
            gap: 10
          }}>
            <button
              onClick={() => goTo(step - 1)}
              style={{
                padding: '8px 14px',
                backgroundColor: 'transparent',
                color: theme.textMuted,
                border: `1px solid ${theme.border}`,
                borderRadius: 7, fontSize: 13, fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            {/* Slides 2 and 4 have their own "next" built into selection; show explicit next for slide 2 */}
            {(step === 2 || step === 4) && (
              <button
                onClick={() => goTo(step + 1)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: theme.primary, color: '#fff',
                  border: 'none', borderRadius: 7,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Next →
              </button>
            )}
          </div>
        )}

        {/* Skip */}
        {step === 0 && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              onClick={handleSkip}
              style={{
                background: 'transparent', border: 'none',
                color: theme.textMuted, fontSize: 12,
                cursor: 'pointer', padding: '4px 8px'
              }}
            >
              Skip setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
