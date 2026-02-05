import React, { useState } from 'react';
import useFoods from './hooks/useFoods';
import { useTheme } from '../../context/ThemeContext';

export default function FoodLogger() {
  const { theme, isDark } = useTheme();
  const { 
    searchResults, 
    meals,
    currentMeal,
    mealName,
    editingMealId,
    summary, 
    period, 
    loading, 
    error, 
    search, 
    addFoodToCurrentMeal,
    removeFoodFromCurrentMeal,
    updateFoodInCurrentMeal,
    clearCurrentMeal,
    saveMeal,
    startEditingMeal,
    deleteMealEntry,
    setMealName,
    changePeriod 
  } = useFoods();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [servingSize, setServingSize] = useState('100');
  const [editingFoodIndex, setEditingFoodIndex] = useState(null);
  const [editingPortionValue, setEditingPortionValue] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      await search(searchQuery);
    }
  }

  function selectFood(food) {
    setSelectedFood(food);
    setServingSize(String(food.serving_weight_grams || 100));
  }

  function getServingSizeNumber() {
    const parsed = Number(servingSize);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return selectedFood?.serving_weight_grams || 100;
  }

  async function handleAddFood(e) {
    e.preventDefault();
    if (!selectedFood) return;

    const servingSizeNumber = getServingSizeNumber();
    const multiplier = servingSizeNumber / (selectedFood.serving_weight_grams || 100);
    const food = {
      foodName: `${selectedFood.food_name} (${servingSizeNumber}g)`,
      calories: Math.round((selectedFood.nf_calories || 0) * multiplier),
      protein: Math.round((selectedFood.nf_protein || 0) * multiplier),
      carbs: Math.round((selectedFood.nf_total_carbohydrate || 0) * multiplier),
      fat: Math.round((selectedFood.nf_total_fat || 0) * multiplier)
    };

    addFoodToCurrentMeal(food);
            setSelectedFood(null);
            setSearchQuery('');
            setServingSize('100');
  }

  async function handleSaveMeal(e) {
    e.preventDefault();
    if (!mealName.trim() || currentMeal.length === 0) return;
    
    try {
      await saveMeal(mealName);
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <div style={{ marginTop: 0, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}>
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
            border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0',
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'inherit',
            backgroundColor: isDark ? theme.bgTertiary : 'white',
            color: isDark ? theme.text : '#1a202c'
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
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: isDark ? theme.bgTertiary : 'white', borderRadius: 6, border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? theme.textMuted : '#718096', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Results</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 200, overflowY: 'auto' }}>
            {searchResults.common.slice(0, 10).map((food, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                <button
                  onClick={() => selectFood(food)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? theme.primary : '#3182ce',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '6px 0',
                    transition: 'color 200ms'
                  }}
                  onMouseEnter={(e) => (e.target.style.color = isDark ? theme.primaryDark : '#2563a8')}
                  onMouseLeave={(e) => (e.target.style.color = isDark ? theme.primary : '#3182ce')}
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
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: isDark ? theme.bgTertiary : 'white', borderRadius: 6, border: isDark ? `2px solid ${theme.primaryDark}` : '2px solid #3182ce' }}>
          <h4 style={{ marginTop: 0, marginBottom: 14, fontSize: 16, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>{selectedFood.food_name}</h4>
          <form onSubmit={handleAddFood}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? theme.textMuted : '#4a5568', marginBottom: 6 }}>
                Serving Size (g)
              </label>
              <input
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                onBlur={() => {
                  if (servingSize === '') {
                    setServingSize(String(selectedFood?.serving_weight_grams || 100));
                  }
                }}
                min={1}
                style={{
                  width: '120px',
                  padding: '8px 12px',
                  border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: isDark ? theme.bgSecondary : 'white',
                  color: isDark ? theme.text : '#1a202c'
                }}
              />
            </div>
            <div style={{ padding: 12, backgroundColor: isDark ? theme.bgSecondary : '#f7fafc', borderRadius: 6, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: isDark ? theme.textMuted : '#718096', marginBottom: 8 }}>Estimated Nutrition</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 2 }}>Calories</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                    {Math.round((selectedFood.nf_calories || 0) * (getServingSizeNumber() / (selectedFood.serving_weight_grams || 100)))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 2 }}>Protein</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                    {Math.round((selectedFood.nf_protein || 0) * (getServingSizeNumber() / (selectedFood.serving_weight_grams || 100)))}g
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 2 }}>Carbs</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                    {Math.round((selectedFood.nf_total_carbohydrate || 0) * (getServingSizeNumber() / (selectedFood.serving_weight_grams || 100)))}g
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 2 }}>Fat</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                    {Math.round((selectedFood.nf_total_fat || 0) * (getServingSizeNumber() / (selectedFood.serving_weight_grams || 100)))}g
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
                Add to Current Meal
              </button>
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: isDark ? theme.textMuted : '#718096',
                  border: isDark ? `1px solid ${theme.border}` : '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isDark ? theme.bgSecondary : '#f7fafc';
                  e.target.style.color = isDark ? theme.text : '#4a5568';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = isDark ? theme.textMuted : '#718096';
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Meal Builder */}
      {currentMeal.length > 0 && (
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: isDark ? theme.bgTertiary : 'white', borderRadius: 6, border: editingMealId ? (isDark ? `2px solid ${theme.primaryDark}` : '2px solid #3182ce') : (isDark ? `2px solid ${theme.primary}` : '2px solid #48bb78') }}>
          <h4 style={{ marginTop: 0, marginBottom: 14, fontSize: 16, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
            {editingMealId ? 'Editing Meal' : 'Current Meal'}
          </h4>
          
          <div style={{ marginBottom: 14 }}>
            {currentMeal.map((food, idx) => (
              <div key={idx} style={{ 
                padding: '8px 12px', 
                marginBottom: 8,
                backgroundColor: isDark ? theme.bgSecondary : '#f7fafc', 
                borderRadius: 6 
              }}>
                {editingFoodIndex === idx ? (
                  // Edit mode for this food
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: isDark ? theme.text : '#1a202c', marginBottom: 8 }}>{food.foodName.replace(/\s*\(\d+g\)/, '')}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: 12, color: isDark ? theme.textMuted : '#4a5568' }}>Portion:</label>
                      <input
                        type="number"
                        value={editingPortionValue}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditingPortionValue(newValue);
                          if (newValue === '') return;
                          const newSize = Number(newValue);
                          if (!Number.isFinite(newSize) || newSize <= 0) return;
                          const baseName = food.foodName.replace(/\s*\(\d+g\)/, '');
                          const originalSize = parseInt(food.foodName.match(/\((\d+)g\)/)?.[1] || 100, 10);
                          const multiplier = newSize / originalSize;
                          
                          updateFoodInCurrentMeal(idx, {
                            foodName: `${baseName} (${newSize}g)`,
                            calories: Math.round(food.calories * multiplier),
                            protein: Math.round(food.protein * multiplier),
                            carbs: Math.round(food.carbs * multiplier),
                            fat: Math.round(food.fat * multiplier)
                          });
                        }}
                        onBlur={() => {
                          if (editingPortionValue === '') {
                            setEditingPortionValue(String(parseInt(food.foodName.match(/\((\d+)g\)/)?.[1] || 100, 10)));
                          }
                        }}
                        min={1}
                        style={{
                          width: '80px',
                          padding: '6px 8px',
                          border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0',
                          borderRadius: 4,
                          fontSize: 13,
                          backgroundColor: isDark ? theme.bgTertiary : 'white',
                          color: isDark ? theme.text : '#1a202c'
                        }}
                      />
                      <span style={{ fontSize: 12, color: isDark ? theme.textMuted : '#718096' }}>grams</span>
                      <button
                        onClick={() => {
                          setEditingFoodIndex(null);
                          setEditingPortionValue('');
                        }}
                        style={{
                          marginLeft: 'auto',
                          padding: '6px 12px',
                          backgroundColor: '#48bb78',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Done
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: isDark ? theme.textMuted : '#718096' }}>
                      {food.calories}cal • {food.protein}p • {food.carbs}c • {food.fat}f
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: isDark ? theme.text : '#1a202c', marginBottom: 4 }}>{food.foodName}</div>
                      <div style={{ fontSize: 12, color: isDark ? theme.textMuted : '#718096' }}>
                        {food.calories}cal • {food.protein}p • {food.carbs}c • {food.fat}f
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          setEditingFoodIndex(idx);
                          setEditingPortionValue(String(parseInt(food.foodName.match(/\((\d+)g\)/)?.[1] || 100, 10)));
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3182ce',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 200ms'
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563a8')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#3182ce')}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeFoodFromCurrentMeal(idx)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fc8181',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 200ms'
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f56565')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#fc8181')}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSaveMeal}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? theme.textMuted : '#4a5568', marginBottom: 6 }}>
                Meal Name
              </label>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g., Breakfast, Lunch, Dinner"
                style={{
                  width: '280px',
                  maxWidth: '100%',
                  padding: '8px 12px',
                  border: isDark ? `1px solid ${theme.border}` : '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: isDark ? theme.bgSecondary : 'white',
                  color: isDark ? theme.text : '#1a202c'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={!mealName.trim()}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: mealName.trim() ? '#48bb78' : '#cbd5e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: mealName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 200ms'
                }}
                onMouseEnter={(e) => {
                  if (mealName.trim()) e.target.style.backgroundColor = '#38a169';
                }}
                onMouseLeave={(e) => {
                  if (mealName.trim()) e.target.style.backgroundColor = '#48bb78';
                }}
              >
                {editingMealId ? 'Update Meal' : 'Save Meal'}
              </button>
              <button
                type="button"
                onClick={clearCurrentMeal}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: isDark ? theme.textMuted : '#718096',
                  border: isDark ? `1px solid ${theme.border}` : '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isDark ? theme.bgSecondary : '#f7fafc';
                  e.target.style.color = isDark ? theme.text : '#4a5568';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = isDark ? theme.textMuted : '#718096';
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today's Meals */}
      {meals && meals.length > 0 && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: isDark ? theme.bgTertiary : 'white', borderRadius: 6, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            Your Meals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {meals.slice(0, 10).map((meal) => {
              const totalCals = meal.foods.reduce((sum, f) => sum + (Number(f.calories) || 0), 0);
              const totalProtein = meal.foods.reduce((sum, f) => sum + (Number(f.protein) || 0), 0);
              const totalCarbs = meal.foods.reduce((sum, f) => sum + (Number(f.carbs) || 0), 0);
              const totalFat = meal.foods.reduce((sum, f) => sum + (Number(f.fat) || 0), 0);

              return (
                <div
                  key={meal.id}
                  style={{
                    padding: '12px',
                    backgroundColor: theme.bgSecondary,
                    borderRadius: 6,
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>
                        {meal.name}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
                        {Math.round(totalCals)}cal • {Math.round(totalProtein)}p • {Math.round(totalCarbs)}c • {Math.round(totalFat)}f
                      </div>
                      <div style={{ fontSize: 11, color: theme.textMuted, fontStyle: 'italic' }}>
                        {meal.foods.length} item{meal.foods.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => startEditingMeal(meal)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3182ce',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 200ms'
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563a8')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#3182ce')}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMealEntry(meal.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fc8181',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 200ms'
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f56565')}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = '#fc8181')}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ 
                      fontSize: 11, 
                      color: isDark ? theme.primary : '#3182ce', 
                      cursor: 'pointer', 
                      fontWeight: 500,
                      userSelect: 'none'
                    }}>
                      Show Foods
                    </summary>
                    <div style={{ marginTop: 8, paddingLeft: 12 }}>
                      {meal.foods.map((food, idx) => (
                        <div key={idx} style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                          • {food.foodName} ({food.calories}cal, {food.protein}p, {food.carbs}c, {food.fat}f)
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Macro Summary */}
      <div style={{ padding: 16, backgroundColor: isDark ? theme.bgTertiary : 'white', borderRadius: 6, border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? theme.textMuted : '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Macro Summary</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => changePeriod('daily')}
              style={{
                padding: '6px 12px',
                backgroundColor: period === 'daily' ? '#3182ce' : (isDark ? theme.bgSecondary : '#e2e8f0'),
                color: period === 'daily' ? 'white' : (isDark ? theme.textMuted : '#4a5568'),
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => {
                if (period !== 'daily') e.target.style.backgroundColor = isDark ? theme.bgTertiary : '#cbd5e0';
              }}
              onMouseLeave={(e) => {
                if (period !== 'daily') e.target.style.backgroundColor = isDark ? theme.bgSecondary : '#e2e8f0';
              }}
            >
              Daily
            </button>
            <button
              onClick={() => changePeriod('weekly')}
              style={{
                padding: '6px 12px',
                backgroundColor: period === 'weekly' ? '#3182ce' : (isDark ? theme.bgSecondary : '#e2e8f0'),
                color: period === 'weekly' ? 'white' : (isDark ? theme.textMuted : '#4a5568'),
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={(e) => {
                if (period !== 'weekly') e.target.style.backgroundColor = isDark ? theme.bgTertiary : '#cbd5e0';
              }}
              onMouseLeave={(e) => {
                if (period !== 'weekly') e.target.style.backgroundColor = isDark ? theme.bgSecondary : '#e2e8f0';
              }}
            >
              Avg
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{ fontSize: 14, color: isDark ? theme.textMuted : '#718096' }}>Loading...</div>
        ) : summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 4 }}>CALORIES</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                {period === 'daily' ? summary.totalCalories || 0 : summary.avgCalories || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 4 }}>PROTEIN</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                {period === 'daily' ? summary.totalProtein || 0 : summary.avgProtein || 0}<span style={{ fontSize: 14 }}>g</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 4 }}>CARBS</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                {period === 'daily' ? summary.totalCarbs || 0 : summary.avgCarbs || 0}<span style={{ fontSize: 14 }}>g</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 4 }}>FAT</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                {period === 'daily' ? summary.totalFat || 0 : summary.avgFat || 0}<span style={{ fontSize: 14 }}>g</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: isDark ? theme.textMuted : '#718096' }}>No data available</div>
        )}
        <div style={{ fontSize: 12, color: isDark ? theme.textMuted : '#a0aec0', marginTop: 12, paddingTop: 12, borderTop: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0' }}>
          {summary && (summary.entryCount || 0)} {period === 'daily' ? 'entries' : 'entries tracked'} {period === 'weekly' && `over ${summary.days || 0} days`}
        </div>
      </div>
    </div>
  );
}
