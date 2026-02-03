import React, { useState } from 'react';
import useFoods from './hooks/useFoods';
import { useTheme } from '../../context/ThemeContext';

export default function FoodLogger() {
  const { theme } = useTheme();
  const { searchResults, summary, period, loading, error, search, addFood, changePeriod } = useFoods();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingSize, setServingSize] = useState(100);

  async function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      await search(searchQuery);
    }
  }

  function selectFood(food) {
    setSelectedFood(food);
    setServingSize(food.serving_weight_grams || 100);
  }

  async function handleAddFood(e) {
    e.preventDefault();
    if (!selectedFood) return;

    const multiplier = servingSize / (selectedFood.serving_weight_grams || 100);
    const calories = Math.round((selectedFood.nf_calories || 0) * multiplier);
    const protein = Math.round((selectedFood.nf_protein || 0) * multiplier);
    const carbs = Math.round((selectedFood.nf_total_carbohydrate || 0) * multiplier);
    const fat = Math.round((selectedFood.nf_total_fat || 0) * multiplier);

    try {
      await addFood(
        `${selectedFood.food_name} (${servingSize}g)`,
        calories,
        protein,
        carbs,
        fat
      );
      setSelectedFood(null);
      setSearchQuery('');
      setSearchResults(null);
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <div style={{ marginTop: 24, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, color: theme.text }}>Food & Macros</h3>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search foods..."
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'inherit'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 200ms'
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563a8')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#3182ce')}
        >
          Search
        </button>
      </form>

      {error && <div style={{ color: '#c53030', fontSize: 13, marginBottom: 16, padding: 10, backgroundColor: '#fed7d7', borderRadius: 4 }}>Error: {error}</div>}

      {/* Search Results */}
      {searchResults && searchResults.common && searchResults.common.length > 0 && (
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: 'white', borderRadius: 6, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#718096', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Results</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 200, overflowY: 'auto' }}>
            {searchResults.common.slice(0, 10).map((food, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                <button
                  onClick={() => selectFood(food)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3182ce',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '6px 0',
                    transition: 'color 200ms'
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#2563a8')}
                  onMouseLeave={(e) => (e.target.style.color = '#3182ce')}
                >
                  {food.food_name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Food Form */}
      {selectedFood && (
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: 'white', borderRadius: 6, border: '2px solid #3182ce' }}>
          <h4 style={{ marginTop: 0, marginBottom: 14, fontSize: 16, fontWeight: 600, color: '#1a202c' }}>{selectedFood.food_name}</h4>
          <form onSubmit={handleAddFood}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4a5568', marginBottom: 6 }}>
                Serving Size (g)
              </label>
              <input
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(Number(e.target.value))}
                min={1}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ padding: 12, backgroundColor: '#f7fafc', borderRadius: 6, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>Estimated Nutrition</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500, marginBottom: 2 }}>Calories</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a202c' }}>
                    {Math.round((selectedFood.nf_calories || 0) * (servingSize / (selectedFood.serving_weight_grams || 100)))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500, marginBottom: 2 }}>Protein</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a202c' }}>
                    {Math.round((selectedFood.nf_protein || 0) * (servingSize / (selectedFood.serving_weight_grams || 100)))}g
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500, marginBottom: 2 }}>Carbs</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a202c' }}>
                    {Math.round((selectedFood.nf_total_carbohydrate || 0) * (servingSize / (selectedFood.serving_weight_grams || 100)))}g
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500, marginBottom: 2 }}>Fat</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a202c' }}>
                    {Math.round((selectedFood.nf_total_fat || 0) * (servingSize / (selectedFood.serving_weight_grams || 100)))}g
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 200ms'
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563a8')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#3182ce')}
              >
                Add Food
              </button>
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: '#718096',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f7fafc';
                  e.target.style.color = '#4a5568';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#718096';
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Macro Summary */}
      <div style={{ padding: 16, backgroundColor: 'white', borderRadius: 6, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Macro Summary</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => changePeriod('daily')}
              style={{
                padding: '6px 12px',
                backgroundColor: period === 'daily' ? '#3182ce' : '#e2e8f0',
                color: period === 'daily' ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => {
                if (period !== 'daily') e.target.style.backgroundColor = '#cbd5e0';
              }}
              onMouseLeave={(e) => {
                if (period !== 'daily') e.target.style.backgroundColor = '#e2e8f0';
              }}
            >
              Daily
            </button>
            <button
              onClick={() => changePeriod('weekly')}
              style={{
                padding: '6px 12px',
                backgroundColor: period === 'weekly' ? '#3182ce' : '#e2e8f0',
                color: period === 'weekly' ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => {
                if (period !== 'weekly') e.target.style.backgroundColor = '#cbd5e0';
              }}
              onMouseLeave={(e) => {
                if (period !== 'weekly') e.target.style.backgroundColor = '#e2e8f0';
              }}
            >
              Avg
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{ fontSize: 14, color: '#718096' }}>Loading...</div>
        ) : summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500, marginBottom: 4 }}>CALORIES</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1a202c' }}>
                {period === 'daily' ? summary.totalCalories || 0 : summary.avgCalories || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500, marginBottom: 4 }}>PROTEIN</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1a202c' }}>
                {period === 'daily' ? summary.totalProtein || 0 : summary.avgProtein || 0}<span style={{ fontSize: 14 }}>g</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500, marginBottom: 4 }}>CARBS</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1a202c' }}>
                {period === 'daily' ? summary.totalCarbs || 0 : summary.avgCarbs || 0}<span style={{ fontSize: 14 }}>g</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 500, marginBottom: 4 }}>FAT</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1a202c' }}>
                {period === 'daily' ? summary.totalFat || 0 : summary.avgFat || 0}<span style={{ fontSize: 14 }}>g</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#718096' }}>No data available</div>
        )}
        <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
          {summary && (summary.entryCount || 0)} {period === 'daily' ? 'entries' : 'entries tracked'} {period === 'weekly' && `over ${summary.days || 0} days`}
        </div>
      </div>
    </div>
  );
}
