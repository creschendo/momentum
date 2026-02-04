import React, { useState } from 'react';
import { calculateTDEE } from '../../api/nutrition';
import { useTheme } from '../../context/ThemeContext';

export default function BMRCalculator() {
  const { theme } = useTheme();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sex' ? value : Number(value)
    }));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Convert imperial to metric if needed
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
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.text }}>
          BMR & TDEE Calculator
        </h3>
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
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Sex */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Sex
          </label>
          <select
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Height */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Weight */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Activity Level */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Activity Level
          </label>
          <select
            name="activity_level"
            value={formData.activity_level}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
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
            backgroundColor: loading ? '#cbd5e0' : '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 200ms',
            marginTop: 8
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#2563a8')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#3182ce')}
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
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              BMR
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#3182ce', marginBottom: 4 }}>
              {result.bmr}
            </div>
            <div style={{ fontSize: 12, color: '#718096' }}>
              calories/day at rest
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TDEE
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#3182ce', marginBottom: 4 }}>
              {result.tdee}
            </div>
            <div style={{ fontSize: 12, color: '#718096' }}>
              calories/day (with activity)
            </div>
          </div>

          {result.macros && (
            <div style={{ gridColumn: '1 / -1', marginTop: 8, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a202c', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Recommended Daily Macros
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f7fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>Protein</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a202c' }}>
                    {result.macros.protein_g || 'N/A'}g
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f7fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>Carbs</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a202c' }}>
                    {result.macros.carbs_g || 'N/A'}g
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f7fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>Fat</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a202c' }}>
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
