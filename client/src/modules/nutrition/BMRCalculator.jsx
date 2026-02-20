import React, { useState, useEffect } from 'react';
import { calculateTDEE } from '../../api/nutrition';
import { useTheme } from '../../context/ThemeContext';
import { useCalorieGoal } from './context/CalorieGoalContext';

export default function BMRCalculator() {
  const { theme, isDark } = useTheme();
  const { calorieGoal, setCalorieGoal } = useCalorieGoal();
  const caretColor = isDark ? 'e4e7eb' : '1a202c';
  const caretIcon = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23${caretColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>")`;
  const [formData, setFormData] = useState({
    age: 25,
    sex: 'male',
    height_cm: 180,
    weight_kg: 75,
    activity_level: 1.55
  });
  const [system, setSystem] = useState('metric'); // 'metric' or 'imperial'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [confirmingGoal, setConfirmingGoal] = useState(null);

  // Load selected goal from context on mount
  useEffect(() => {
    if (calorieGoal) {
      setSelectedGoal(calorieGoal.goalKey);
    }
  }, [calorieGoal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sex' ? value : Number(value)
    }));
  };

  // Converts form values as needed and requests TDEE from the backend.
  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Backend expects metric values, so convert imperial input first.
      const dataToSend = system === 'imperial' 
        ? {
            age: formData.age,
            sex: formData.sex,
            height_cm: Math.round(formData.height_in * 2.54),
            weight_kg: Math.round(formData.weight_lbs * 0.453592),
            activity_level: formData.activity_level
          }
        : formData;

      const data = await calculateTDEE(dataToSend);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activityLevels = [
    { value: 1.375, label: 'Sedentary (little exercise)' },
    { value: 1.55, label: 'Lightly active (1-3 days/week)' },
    { value: 1.725, label: 'Moderately active (3-5 days/week)' },
    { value: 1.9, label: 'Very active (6-7 days/week)' }
  ];

  const isMetric = system === 'metric';
  const heightValue = isMetric ? formData.height_cm : (formData.height_in || 70);
  const weightValue = isMetric ? formData.weight_kg : (formData.weight_lbs || 165);

  return (
    <div style={{ marginTop: 0, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.text }}>
            BMR & TDEE Calculator
          </h3>
          {selectedGoal && result && (
            <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
              Daily Goal: <strong style={{ color: theme.primary }}>{result.calorieTargets?.[selectedGoal]} calories</strong>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['metric', 'imperial'].map((sys) => (
            <button
              key={sys}
              onClick={() => setSystem(sys)}
              style={{
                padding: '6px 14px',
                backgroundColor: system === sys ? theme.primary : theme.border,
                color: system === sys ? 'white' : theme.text,
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms',
                textTransform: 'capitalize'
              }}
              onMouseEnter={(e) => {
                if (system !== sys) {
                  e.target.style.backgroundColor = theme.borderLight;
                }
              }}
              onMouseLeave={(e) => {
                if (system !== sys) {
                  e.target.style.backgroundColor = theme.border;
                }
              }}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCalculate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Age */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? theme.textMuted : '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Age (years)
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min={1}
            max={150}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: isDark ? `1px solid ${theme.border}` : '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              backgroundColor: isDark ? theme.bgTertiary : 'white',
              color: isDark ? theme.text : '#1a202c'
            }}
          />
        </div>

        {/* Sex */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? theme.textMuted : '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Sex
          </label>
          <select
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            className="minimal-select"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: isDark ? `1px solid ${theme.border}` : '1px solid #d5dbe3',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              backgroundColor: isDark ? theme.bgTertiary : 'white',
              color: isDark ? theme.text : '#1a202c',
              outline: 'none',
              boxShadow: 'none',
              backgroundImage: caretIcon,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '14px',
              paddingRight: 32
            }}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Height */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? theme.textMuted : '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Height ({isMetric ? 'cm' : 'in'})
          </label>
          <input
            type="number"
            name={isMetric ? 'height_cm' : 'height_in'}
            value={heightValue}
            onChange={(e) => {
              if (isMetric) {
                setFormData((prev) => ({ ...prev, height_cm: Number(e.target.value) }));
              } else {
                setFormData((prev) => ({ ...prev, height_in: Number(e.target.value) }));
              }
            }}
            min={isMetric ? 100 : 40}
            max={isMetric ? 250 : 96}
            step={isMetric ? 1 : 0.5}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: isDark ? `1px solid ${theme.border}` : '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              backgroundColor: isDark ? theme.bgTertiary : 'white',
              color: isDark ? theme.text : '#1a202c'
            }}
          />
        </div>

        {/* Weight */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? theme.textMuted : '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Weight ({isMetric ? 'kg' : 'lbs'})
          </label>
          <input
            type="number"
            name={isMetric ? 'weight_kg' : 'weight_lbs'}
            value={weightValue}
            onChange={(e) => {
              if (isMetric) {
                setFormData((prev) => ({ ...prev, weight_kg: Number(e.target.value) }));
              } else {
                setFormData((prev) => ({ ...prev, weight_lbs: Number(e.target.value) }));
              }
            }}
            min={isMetric ? 20 : 45}
            max={isMetric ? 200 : 440}
            step={isMetric ? 0.5 : 1}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: isDark ? `1px solid ${theme.border}` : '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              backgroundColor: isDark ? theme.bgTertiary : 'white',
              color: isDark ? theme.text : '#1a202c'
            }}
          />
        </div>

        {/* Activity Level */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? theme.textMuted : '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Activity Level
          </label>
          <select
            name="activity_level"
            value={formData.activity_level}
            onChange={handleChange}
            className="minimal-select"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: isDark ? `1px solid ${theme.border}` : '1px solid #d5dbe3',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              backgroundColor: isDark ? theme.bgTertiary : 'white',
              color: isDark ? theme.text : '#1a202c',
              outline: 'none',
              boxShadow: 'none',
              backgroundImage: caretIcon,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '14px',
              paddingRight: 32
            }}
          >
            {activityLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            gridColumn: '1 / -1',
            padding: '12px 20px',
            backgroundColor: loading ? theme.border : theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 200ms',
            marginTop: 8
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = theme.primaryDark)}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = theme.primary)}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>

      {error && (
        <div style={{
          padding: 12,
          backgroundColor: '#fed7d7',
          border: '1px solid #fc8181',
          borderRadius: 6,
          color: '#c53030',
          fontSize: 13,
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          padding: 20,
          backgroundColor: isDark ? theme.bgTertiary : 'white',
          border: isDark ? `1px solid ${theme.border}` : '1px solid #e2e8f0',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 24
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: '16px 12px', backgroundColor: isDark ? theme.bgSecondary : '#f7fafc', borderRadius: 6, border: `1px solid ${isDark ? theme.border : '#e2e8f0'}`, gridColumn: '1 / -1'  }}>
              <div style={{ fontSize: 10, color: isDark ? theme.textMuted : '#718096', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                BMR
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: theme.primary, marginBottom: 4 }}>
                {result.bmr}
              </div>
              <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#718096' }}>
                at rest
              </div>
            </div>

            {[
              { key: 'maintain', label: 'Maintain Weight', value: result.calorieTargets?.maintain || result.tdee, color: '#48bb78', desc: 'no change' },
              { key: 'mildWeightLoss', label: 'Mild Loss', value: result.calorieTargets?.mildWeightLoss, color: '#4299e1', desc: '0.5 lb/week' },
              { key: 'weightLoss', label: 'Weight Loss', value: result.calorieTargets?.weightLoss, color: '#3182ce', desc: '1 lb/week' },
              { key: 'extremeWeightLoss', label: 'Extreme Weight Loss', value: result.calorieTargets?.extremeWeightLoss, color: '#ed8936', desc: '1.5 lb/week' }
            ].map((goal) => (
              <div 
                key={goal.key} 
                onClick={() => setConfirmingGoal(goal)}
                style={{ 
                  textAlign: 'center', 
                  padding: '16px 12px', 
                  backgroundColor: selectedGoal === goal.key ? goal.color : (isDark ? theme.bgSecondary : '#f7fafc'), 
                  borderRadius: 6, 
                  border: selectedGoal === goal.key ? `2px solid ${goal.color}` : `1px solid ${isDark ? theme.border : '#e2e8f0'}`,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  transform: 'scale(1.0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = `0 4px 12px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`;
                  if (selectedGoal !== goal.key) {
                    e.currentTarget.style.backgroundColor = isDark ? theme.border : '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1.0)';
                  e.currentTarget.style.boxShadow = 'none';
                  if (selectedGoal !== goal.key) {
                    e.currentTarget.style.backgroundColor = isDark ? theme.bgSecondary : '#f7fafc';
                  }
                }}
              >
                <div style={{ fontSize: 10, color: selectedGoal === goal.key ? 'white' : (isDark ? theme.textMuted : '#718096'), fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {goal.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: selectedGoal === goal.key ? 'white' : goal.color, marginBottom: 4 }}>
                  {goal.value}
                </div>
                <div style={{ fontSize: 11, color: selectedGoal === goal.key ? 'rgba(255,255,255,0.9)' : (isDark ? theme.textMuted : '#718096') }}>
                  {goal.desc}
                </div>
              </div>
            ))}

          </div>

          {confirmingGoal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 24, maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 600, color: theme.text }}>Set Daily Calorie Goal</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: 14, color: theme.textSecondary }}>
                  Set your daily calorie goal to <strong>{confirmingGoal.value} calories</strong> ({confirmingGoal.label.toLowerCase()})?
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setConfirmingGoal(null)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: theme.bgTertiary,
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 200ms'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme.border;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = theme.bgTertiary;
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGoal(confirmingGoal.key);
                      setCalorieGoal({
                        goalKey: confirmingGoal.key,
                        goalValue: confirmingGoal.value,
                        goalLabel: confirmingGoal.label
                      });
                      setConfirmingGoal(null);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: confirmingGoal.color,
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 200ms'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '1';
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedGoal && (
            <div style={{ padding: 16, backgroundColor: isDark ? theme.bgSecondary : '#f7fafc', borderRadius: 8, border: `2px solid ${theme.primary}`, marginTop: 12 }}>
              <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#718096', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Your Daily Goal
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.primary }}>
                {result.calorieTargets?.[selectedGoal]}
                <span style={{ fontSize: 14, marginLeft: 8, color: isDark ? theme.textSecondary : '#718096' }}>calories/day</span>
              </div>
            </div>
          )}

          {result.macros && (
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: isDark ? `1px solid ${theme.border}` : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? theme.text : '#1a202c', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Recommended Daily Macros (based on maintenance)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: isDark ? theme.bgSecondary : '#f7fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: isDark ? theme.textMuted : '#718096', marginBottom: 4 }}>Protein</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? theme.text : '#1a202c' }}>
                    {result.macros.protein_g || 'N/A'}g
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: isDark ? theme.bgSecondary : '#f7fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: isDark ? theme.textMuted : '#718096', marginBottom: 4 }}>Carbs</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? theme.text : '#1a202c' }}>
                    {result.macros.carbs_g || 'N/A'}g
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: isDark ? theme.bgSecondary : '#f7fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: isDark ? theme.textMuted : '#718096', marginBottom: 4 }}>Fat</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? theme.text : '#1a202c' }}>
                    {result.macros.fat_g || 'N/A'}g
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
