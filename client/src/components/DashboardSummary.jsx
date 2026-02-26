import React, { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const KG_TO_LB = 2.2046226218;

function DashboardSummary() {
  const { theme, currentTheme } = useTheme();
  const coveAccent = '#fb923c';
  const summaryAccent = currentTheme === 'cove' ? coveAccent : theme.primary;
  const [cardOrder, setCardOrder] = useState(() => {
    const fallback = ['calories', 'water', 'weight-change', 'weight-streak'];
    const saved = localStorage.getItem('dashboard-summary-card-order');
    if (!saved) return fallback;

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return fallback;
      const filtered = parsed.filter((item) => fallback.includes(item));
      const missing = fallback.filter((item) => !filtered.includes(item));
      const normalized = [...filtered, ...missing];
      return normalized.length === fallback.length ? normalized : fallback;
    } catch {
      return fallback;
    }
  });
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverCard, setDragOverCard] = useState(null);
  const dragSourceRef = useRef(null);
  const isDraggingRef = useRef(false);
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
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('dashboard-summary-card-order', JSON.stringify(cardOrder));
  }, [cardOrder]);

  useEffect(() => {
    const fetchStats = async ({ background = false } = {}) => {
      if (!background && !hasLoadedOnceRef.current) {
        setLoading(true);
      }
      if (!background) {
        setError(null);
      }
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
        hasLoadedOnceRef.current = true;
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        if (!hasLoadedOnceRef.current) {
          setError(err.message);
        }
      } finally {
        if (!background || !hasLoadedOnceRef.current) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    // Set up interval to refresh stats every 2 minutes
    const interval = setInterval(() => {
      fetchStats({ background: true });
    }, 120000);

    // Listen for storage changes (e.g., calorie goal updates)
    const handleStorageChange = (e) => {
      if (e.key === 'calorieGoal') {
        fetchStats({ background: true });
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

  const handleCardMouseDown = (cardKey) => {
    dragSourceRef.current = cardKey;
    setDraggedCard(cardKey);
  };

  const handleCardMouseUp = () => {
    if (!isDraggingRef.current) {
      dragSourceRef.current = null;
      setDraggedCard(null);
      setDragOverCard(null);
    }
  };

  const handleCardDragStart = (e, cardKey) => {
    const sourceCardKey = dragSourceRef.current || cardKey;
    dragSourceRef.current = sourceCardKey;
    isDraggingRef.current = true;
    setDraggedCard(sourceCardKey);
    setDragOverCard(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/x-summary-card', sourceCardKey);
    e.dataTransfer.setData('text/plain', sourceCardKey);
  };

  const handleCardDragOver = (e, cardKey) => {
    if (dragSourceRef.current === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCard(cardKey);
  };

  const handleCardDragEnter = (e, cardKey) => {
    if (dragSourceRef.current === null) return;
    e.preventDefault();
    setDragOverCard(cardKey);
  };

  const handleCardDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setDragOverCard(null);
  };

  const handleCardDrop = (e, targetCardKey) => {
    if (dragSourceRef.current === null) return;
    e.preventDefault();

    const sourceCardKey = dragSourceRef.current;

    if (!sourceCardKey) return;
    if (sourceCardKey === targetCardKey) {
      setDraggedCard(null);
      setDragOverCard(null);
      return;
    }

    const sourceIndex = cardOrder.indexOf(sourceCardKey);
    const targetIndex = cardOrder.indexOf(targetCardKey);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedCard(null);
      setDragOverCard(null);
      return;
    }

    const nextOrder = [...cardOrder];
    nextOrder[sourceIndex] = targetCardKey;
    nextOrder[targetIndex] = sourceCardKey;
    setCardOrder(nextOrder);
    isDraggingRef.current = false;
    dragSourceRef.current = null;
    setDraggedCard(null);
    setDragOverCard(null);
  };

  const handleCardDragEnd = () => {
    isDraggingRef.current = false;
    dragSourceRef.current = null;
    setDraggedCard(null);
    setDragOverCard(null);
  };

  const getCardDragStyles = (cardKey) => {
    const isDragging = draggedCard === cardKey;
    const isDraggingOver = draggedCard !== null && dragOverCard === cardKey;

    return {
      opacity: isDragging ? 0.4 : 1,
      border: isDraggingOver ? `2px dashed ${theme.primary}` : `1px solid ${theme.border}`,
      backgroundColor: isDraggingOver ? theme.bgTertiary : theme.bg,
      cursor: 'grab'
    };
  };

  const StatCard = ({ cardKey, label, value, unit, color, subtitle }) => (
    <motion.div
      className="module-card"
      draggable
      onMouseDown={() => handleCardMouseDown(cardKey)}
      onMouseUp={handleCardMouseUp}
      onDragStart={(e) => handleCardDragStart(e, cardKey)}
      onDragEnter={(e) => handleCardDragEnter(e, cardKey)}
      onDragOver={(e) => handleCardDragOver(e, cardKey)}
      onDragLeave={(e) => handleCardDragLeave(e)}
      onDrop={(e) => handleCardDrop(e, cardKey)}
      onDragEnd={handleCardDragEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 12,
        ...getCardDragStyles(cardKey),
        borderRadius: 8,
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
    </motion.div>
  );

  const ProgressBar = ({ cardKey, label, current, goal, unit, color }) => {
    const percent = Math.min(100, Math.round((current / goal) * 100));

    return (
      <motion.div
        className="module-card"
        draggable
        onMouseDown={() => handleCardMouseDown(cardKey)}
        onMouseUp={handleCardMouseUp}
        onDragStart={(e) => handleCardDragStart(e, cardKey)}
        onDragEnter={(e) => handleCardDragEnter(e, cardKey)}
        onDragOver={(e) => handleCardDragOver(e, cardKey)}
        onDragLeave={(e) => handleCardDragLeave(e)}
        onDrop={(e) => handleCardDrop(e, cardKey)}
        onDragEnd={handleCardDragEnd}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: 12,
          ...getCardDragStyles(cardKey),
          borderRadius: 8,
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
          <motion.div
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: '100%',
              backgroundColor: color,
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted }}>{percent}% complete</div>
      </motion.div>
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
        {cardOrder.map((cardKey, index) => {
          if (cardKey === 'weight-change') {
            return (
              <StatCard
                key={cardKey}
                cardKey={cardKey}
                label="Weight Change"
                value={`${(stats.weightChange * KG_TO_LB) > 0 ? '+' : ''}${(stats.weightChange * KG_TO_LB).toFixed(1)}`}
                unit="lbs"
                color={currentTheme === 'cove' ? summaryAccent : (stats.weightChange < 0 ? theme.primary : stats.weightChange > 0 ? theme.error : theme.textSecondary)}
                subtitle={`Latest: ${stats.latestWeight ? (stats.latestWeight * KG_TO_LB).toFixed(1) : '—'} lbs`}
              />
            );
          }

          if (cardKey === 'weight-streak') {
            return (
              <StatCard
                key={cardKey}
                cardKey={cardKey}
                label="Weight Streak"
                value={stats.weightLoggingStreak}
                unit="days"
                color={summaryAccent}
                subtitle={`${stats.daysLoggedThisWeek} days this week`}
              />
            );
          }

          if (cardKey === 'water') {
            return (
              <ProgressBar
                key={cardKey}
                cardKey={cardKey}
                label="Water"
                current={Math.round(stats.waterToday / 250)}
                goal={Math.round(stats.waterGoal / 250)}
                unit="cps"
                color={summaryAccent}
              />
            );
          }

          return (
            <ProgressBar
              key={cardKey}
              cardKey={cardKey}
              label="Calories"
              current={stats.caloriestoday}
              goal={stats.caloriesGoal}
              unit="cal"
              color={summaryAccent}
            />
          );
        })}
      </div>
    </div>
  );
}

export default memo(DashboardSummary);
