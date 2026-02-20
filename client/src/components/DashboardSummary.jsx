import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const KG_TO_LB = 2.2046226218;

export default function DashboardSummary() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    weightChange: 0,
    weightLoggingStreak: 0,
    daysLoggedThisWeek: 0,
    caloriestoday: 0,
    caloriesGoal: 2200,
    waterToday: 0,
    waterGoal: 2000,
    latestWeight: null,
    goalWeight: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch weight trend for this week and all-time
        const [weightTrend, foodSummary, waterSummary] = await Promise.all([
          fetch('/api/nutrition/weight/trend?days=7').then((r) => (r.ok ? r.json() : Promise.reject(new Error('Weight trend failed')))),
          fetch('/api/nutrition/foods/summary?period=daily').then((r) => (r.ok ? r.json() : Promise.reject(new Error('Food summary failed')))),
          fetch('/api/nutrition/water/summary?period=daily').then((r) => (r.ok ? r.json() : Promise.reject(new Error('Water summary failed'))))
        ]);

        // Calculate weight change this week
        const weightChange = weightTrend.stats.changeKg || 0;
        const latestWeight = weightTrend.stats.latestKg;

        // Calculate days logged this week
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const daysLoggedThisWeek = new Set(
          weightTrend.points.map((p) => p.entryDate)
        ).size;

        // Calculate weight logging streak (consecutive days backwards from today)
        const todayStr = today.toISOString().slice(0, 10);
        let streak = 0;
        let checkDate = new Date(today);
        const pointsByDate = new Map(weightTrend.points.map((p) => [p.entryDate, true]));

        while (pointsByDate.has(checkDate.toISOString().slice(0, 10))) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }

        // Get calories from summary (which now includes meals)
        const todayCalories = foodSummary.totalCalories || 0;

        // Get calorie goal from localStorage (set by BMR Calculator)
        const savedCalorieGoal = localStorage.getItem('calorieGoal');
        const calorieGoalValue = savedCalorieGoal ? JSON.parse(savedCalorieGoal).goalValue : 2200;

        // Water intake today
        const waterToday = waterSummary.totalMl || 0;

        setStats({
          weightChange: Number(weightChange.toFixed(1)),
          weightLoggingStreak: streak,
          daysLoggedThisWeek,
          caloriestoday: Math.round(todayCalories),
          caloriesGoal: calorieGoalValue,
          waterToday,
          waterGoal: 2000,
          latestWeight,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up interval to refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 10000);

    // Listen for storage changes (e.g., calorie goal updates)
    const handleStorageChange = (e) => {
      if (e.key === 'calorieGoal') {
        fetchStats();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const waterPercent = Math.min(100, Math.round((stats.waterToday / stats.waterGoal) * 100));
  const caloriePercent = Math.min(100, Math.round((stats.caloriestoday / stats.caloriesGoal) * 100));

  const StatCard = ({ label, value, unit, color, subtitle }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 12,
        backgroundColor: theme.bg,
        borderRadius: 8,
        border: `1px solid ${theme.border}`,
        flex: 1,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 12, color: theme.textSecondary }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color }}>
        {value}
        <span style={{ fontSize: 12, marginLeft: 4, color: theme.textSecondary }}>{unit}</span>
      </div>
      {subtitle && <div style={{ fontSize: 11, color: theme.textMuted }}>{subtitle}</div>}
    </div>
  );

  const ProgressBar = ({ label, current, goal, unit, color }) => {
    const percent = Math.min(100, Math.round((current / goal) * 100));
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: 12,
          backgroundColor: theme.bg,
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
          flex: 1,
          minWidth: 160,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: theme.textSecondary }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
            {current} / {goal} {unit}
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: 6,
            backgroundColor: theme.bgTertiary,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              backgroundColor: color,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted }}>{percent}% complete</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          backgroundColor: theme.bgSecondary,
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
          color: theme.textMuted,
          fontSize: 13,
        }}
      >
        Loading dashboard stats...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          backgroundColor: theme.bgSecondary,
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
          color: theme.error,
          fontSize: 13,
        }}
      >
        Error loading stats: {error}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: theme.bgSecondary,
        borderRadius: 8,
        border: `1px solid ${theme.border}`,
        marginBottom: 16,
      }}
    >
      <h2 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: theme.text }}>
        This Week's Progress
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <StatCard
          label="Weight Change"
          value={`${(stats.weightChange * KG_TO_LB) > 0 ? '+' : ''}${(stats.weightChange * KG_TO_LB).toFixed(1)}`}
          unit="lbs"
          color={stats.weightChange < 0 ? theme.primary : stats.weightChange > 0 ? theme.error : theme.textSecondary}
          subtitle={`Latest: ${stats.latestWeight ? (stats.latestWeight * KG_TO_LB).toFixed(1) : '—'} lbs`}
        />
        <StatCard
          label="Weight Streak"
          value={stats.weightLoggingStreak}
          unit="days"
          color={theme.primary}
          subtitle={`${stats.daysLoggedThisWeek} days this week`}
        />
        <ProgressBar
          label="Water"
          current={Math.round(stats.waterToday / 250)}
          goal={Math.round(stats.waterGoal / 250)}
          unit="cps"
          color={theme.primary}
        />
        <ProgressBar
          label="Calories"
          current={stats.caloriestoday}
          goal={stats.caloriesGoal}
          unit="cal"
          color={theme.primary}
        />
      </div>
    </div>
  );
}
