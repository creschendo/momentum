// FoodLogger — food search, meal composition, and macro tracking component.
// Wraps useFoods to provide a 3-step flow: search → stage foods in a named meal → save.
// Displays per-period macro summaries as progress rings relative to the active calorie goal.
import React, { useState } from 'react';
import useFoods from './hooks/useFoods';
import { useTheme } from '../../context/ThemeContext';
import { useCalorieGoal } from './context/CalorieGoalContext';
import type { FoodEntry } from '../../api/nutrition';
import type { Meal } from '../../types/modules';

/** A single food item returned by the nutrition API search. */
interface SearchFood {
  food_name: string;
  serving_weight_grams?: number;
  nf_calories?: number;
  nf_protein?: number;
  nf_total_carbohydrate?: number;
  nf_total_fat?: number;
}

/** Top-level shape of the food search API response. */
interface SearchResults {
  common: SearchFood[];
}

/**
 * Per-gram macro rates cached on a staged meal item so that portion edits
 * can rescale calories/protein/carbs/fat without a new API call.
 */
interface NutritionBasis {
  caloriesPerGram: number;
  proteinPerGram: number;
  carbsPerGram: number;
  fatPerGram: number;
}

/**
 * A food entry currently staged in the meal composition area.
 * Extends FoodEntry with the canonical base name and cached NutritionBasis
 * used for on-the-fly portion rescaling.
 */
interface MealFood extends FoodEntry {
  baseName?: string;
  servingGrams?: number;
  nutritionBasis?: NutritionBasis;
}

/** Macro/calorie aggregate returned by the food summary endpoint for a given period. */
interface FoodSummary {
  avgCalories?: number;
  totalCalories?: number;
  avgProtein?: number;
  totalProtein?: number;
  avgCarbs?: number;
  totalCarbs?: number;
  avgFat?: number;
  totalFat?: number;
  entryCount?: number;
  days?: number;
}

/** Props for the inline SVG circular macro progress ring. */
interface ProgressRingProps {
  value: number;
  max: number;
  color: string;
  size?: number;
}

/** Safe numeric conversion — returns `fallback` when `value` is not a finite number. */
const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function FoodLogger() {
  const { theme, isDark, currentTheme } = useTheme();
  const { calorieGoal } = useCalorieGoal();
  // Hook centralizes search, staged meal editing, persistence, and summaries.
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

  const typedSearchResults = searchResults as SearchResults | null;
  const typedSummary = summary as FoodSummary | null;
  const typedMeals = meals as Meal[];
  const typedCurrentMeal = currentMeal as MealFood[];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<SearchFood | null>(null);
  const [servingSize, setServingSize] = useState('100');
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [editingPortionValue, setEditingPortionValue] = useState('');
  const [deleteConfirmMealId, setDeleteConfirmMealId] = useState<number | string | null>(null);
  const [mealsOpen, setMealsOpen] = useState(false);
  const macroPeriodAccent = theme.primaryDark;
  const macroPeriodAccentGlow = currentTheme === 'cove' ? '0 0 0 2px rgba(255, 255, 255, 0.45)' : '0 0 0 2px rgba(62, 207, 142, 0.35)';
  const searchHoverOutline = currentTheme === 'night' ? 'rgba(255, 255, 255, 0.55)' : theme.borderLight;
  const searchResultHoverOutline = currentTheme === 'night' ? 'rgba(255, 255, 255, 0.45)' : theme.primaryDark;
  const searchResultHoverBg = isDark ? theme.bgSecondary : '#f8fafc';
  const mealsDropdownHighlight = currentTheme === 'cove' ? 'rgba(255, 255, 255, 0.55)' : theme.borderLight;

  /** Extracts the gram value embedded in a food name like "Chicken Breast (120g)" → 120. Falls back to 100g. */
  const getServingFromFoodName = (foodName: string) => {
    const match = String(foodName || '').match(/\((\d+(?:\.\d+)?)g\)/);
    const value = Number(match?.[1] || '100');
    return Number.isFinite(value) && value > 0 ? value : 100;
  };

  /** Returns cached per-gram macro rates for a staged meal food, computing them on first access. */
  const getNutritionBasis = (food: MealFood | null | undefined): NutritionBasis => {
    if (food?.nutritionBasis) return food.nutritionBasis;
    const servingGrams = Number(food?.servingGrams) > 0 ? Number(food?.servingGrams) : getServingFromFoodName(food?.foodName || '');
    const safeServing = servingGrams > 0 ? servingGrams : 100;
    return {
      caloriesPerGram: toNumber(food?.calories) / safeServing,
      proteinPerGram: toNumber(food?.protein) / safeServing,
      carbsPerGram: toNumber(food?.carbs) / safeServing,
      fatPerGram: toNumber(food?.fat) / safeServing
    };
  };

  /** Rescales all macro values for a staged food to a new serving size in grams. */
  const buildFoodFromBasis = (food: MealFood, grams: number): MealFood => {
    const basis = getNutritionBasis(food);
    const baseName = food?.baseName || String(food?.foodName || '').replace(/\s*\(\d+(?:\.\d+)?g\)/, '');
    return {
      ...food,
      baseName,
      servingGrams: grams,
      nutritionBasis: basis,
      foodName: `${baseName} (${grams}g)`,
      calories: Math.round(basis.caloriesPerGram * grams),
      protein: Math.round(basis.proteinPerGram * grams),
      carbs: Math.round(basis.carbsPerGram * grams),
      fat: Math.round(basis.fatPerGram * grams)
    };
  };

  // Progress ring component
  const ProgressRing = ({ value, max, color, size = 80 }: ProgressRingProps) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const safeMax = max > 0 ? max : 1;
    const percent = Math.min(value / safeMax, 1);
    const strokeDashoffset = circumference - (percent * circumference);
    
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? theme.border : '#e2e8f0'}
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
    );
  };

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (searchQuery.trim()) {
      await search(searchQuery);
    }
  }

  /** Selects a food from the search results and pre-fills the serving size field. */
  function selectFood(food: SearchFood) {
    setSelectedFood(food);
    setServingSize(String(food.serving_weight_grams || 100));
  }

  // Normalizes user-entered serving size before macro calculations.
  function getServingSizeNumber() {
    const parsed = Number(servingSize);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return selectedFood?.serving_weight_grams || 100;
  }

  // Converts selected food to scaled macros and adds it to the staged meal.
  async function handleAddFood(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFood) return;

    const servingSizeNumber = getServingSizeNumber();
    const multiplier = servingSizeNumber / (selectedFood.serving_weight_grams || 100);
    const sourceServing = selectedFood.serving_weight_grams || 100;
    const food: MealFood = {
      baseName: selectedFood.food_name,
      servingGrams: servingSizeNumber,
      nutritionBasis: {
        caloriesPerGram: (selectedFood.nf_calories || 0) / sourceServing,
        proteinPerGram: (selectedFood.nf_protein || 0) / sourceServing,
        carbsPerGram: (selectedFood.nf_total_carbohydrate || 0) / sourceServing,
        fatPerGram: (selectedFood.nf_total_fat || 0) / sourceServing
      },
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

  /** Persists the staged meal (POST or PATCH depending on whether an existing meal is being edited). */
  async function handleSaveMeal(e: React.FormEvent<HTMLFormElement>) {
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
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.text }}>Food & Macros</h3>
        
      </div>

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
            color: isDark ? theme.text : '#1a202c',
            boxShadow: 'none',
            transition: 'border-color 200ms ease, box-shadow 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = searchHoverOutline;
            e.currentTarget.style.boxShadow = `0 0 0 2px ${searchHoverOutline}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDark ? theme.border : '#cbd5e0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 200ms'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.primaryDark)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.primary)}
        >
          Search
        </button>
      </form>

      {error && <div style={{ color: '#c53030', fontSize: 13, marginBottom: 16, padding: 10, backgroundColor: '#fed7d7', borderRadius: 4 }}>Error: {error}</div>}

      {/* Search Results */}
      {typedSearchResults && typedSearchResults.common && typedSearchResults.common.length > 0 && (
        <div className="tab-swap-fade" style={{ marginBottom: 20, padding: 16, backgroundColor: isDark ? theme.bgTertiary : 'white', borderRadius: 8, border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? theme.textMuted : '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Results</div>
            <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#718096' }}>{Math.min(typedSearchResults.common.length, 10)} shown</div>
          </div>
          <ul className="meals-dropdown-scroll" style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 240, overflowY: 'auto' }}>
            {typedSearchResults.common.slice(0, 10).map((food, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => selectFood(food)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '9px 10px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    color: isDark ? theme.text : '#1a202c',
                    cursor: 'pointer',
                    fontSize: 14,
                    textAlign: 'left',
                    boxShadow: 'none',
                    transition: 'background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = searchResultHoverBg;
                    e.currentTarget.style.borderColor = searchResultHoverOutline;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${searchResultHoverOutline}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{food.food_name}</span>
                  <span style={{ fontSize: 11, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                    ~{Math.round(food.serving_weight_grams || 100)}g
                  </span>
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
                className="no-spin"
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
                  backgroundColor: theme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 200ms'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.primaryDark)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.primary)}
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
                  e.currentTarget.style.backgroundColor = isDark ? theme.bgSecondary : '#f7fafc';
                  e.currentTarget.style.color = isDark ? theme.text : '#4a5568';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = isDark ? theme.textMuted : '#718096';
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
            {typedCurrentMeal.map((food, idx) => (
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
                        className="no-spin"
                        type="number"
                        value={editingPortionValue}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditingPortionValue(newValue);
                          if (newValue === '') return;
                          const newSize = Number(newValue);
                          if (!Number.isFinite(newSize) || newSize <= 0) return;
                          updateFoodInCurrentMeal(idx, buildFoodFromBasis(food, newSize));
                        }}
                        onBlur={() => {
                          if (editingPortionValue === '') {
                            setEditingPortionValue(String(food.servingGrams || getServingFromFoodName(food.foodName)));
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
                          backgroundColor: theme.primary,
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
                          setEditingPortionValue(String(food.servingGrams || getServingFromFoodName(food.foodName)));
                        }}
                        aria-label="Edit food"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: theme.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 200ms'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.primaryDark)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.primary)}
                      >
                        <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>✎</span>
                      </button>
                      <button
                        onClick={() => removeFoodFromCurrentMeal(idx)}
                        aria-label="Remove food"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: theme.error,
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background 200ms'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        🗑
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
                  backgroundColor: mealName.trim() ? theme.primary : theme.border,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: mealName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 200ms'
                }}
                onMouseEnter={(e) => {
                  if (mealName.trim()) e.currentTarget.style.backgroundColor = theme.primaryDark;
                }}
                onMouseLeave={(e) => {
                  if (mealName.trim()) e.currentTarget.style.backgroundColor = theme.primary;
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
                  e.currentTarget.style.backgroundColor = isDark ? theme.bgSecondary : '#f7fafc';
                  e.currentTarget.style.color = isDark ? theme.text : '#4a5568';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = isDark ? theme.textMuted : '#718096';
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meals dropdown (collapsed by default) */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Your Meals
        </div>
        <button
          onClick={() => setMealsOpen((v) => !v)}
          aria-expanded={mealsOpen}
          aria-label={mealsOpen ? 'Collapse meals' : 'Expand meals'}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: isDark ? theme.bgTertiary : 'white',
            border: `1px solid ${theme.border}`,
            borderBottom: mealsOpen ? 'none' : `1px solid ${theme.border}`,
            color: isDark ? theme.text : '#1a202c',
            borderRadius: mealsOpen ? '6px 6px 0 0' : 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: 'none',
            transition: 'box-shadow 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${mealsDropdownHighlight}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: 14,
              lineHeight: 1,
              color: isDark ? theme.textMuted : '#4a5568',
              transform: mealsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 220ms ease'
            }}
          >
            ▾
          </span>
        </button>

        <div
          style={{
            marginTop: 0,
            maxHeight: mealsOpen ? 560 : 0,
            opacity: mealsOpen ? 1 : 0,
            transform: mealsOpen ? 'translateY(0)' : 'translateY(-6px)',
            overflow: 'hidden',
            willChange: 'max-height, opacity, transform',
            transition: 'max-height 360ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 260ms ease, transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1), margin-top 220ms ease'
          }}
        >
          <div className="meals-dropdown-scroll" style={{ padding: 16, backgroundColor: isDark ? theme.bgTertiary : 'white', borderRadius: '0 0 6px 6px', border: `1px solid ${theme.border}`, borderTop: 'none', maxHeight: 520, overflowY: 'auto', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
            {(() => {
              if (!typedMeals || typedMeals.length === 0) return <div style={{ fontSize: 13, color: isDark ? theme.textMuted : '#718096' }}>No meals logged</div>;

              // group meals by date (YYYY-MM-DD), only include up to a week before
              const now = new Date();
              const cutoff = new Date();
              cutoff.setDate(now.getDate() - 7);

              const recent = typedMeals.filter((m) => m.timestamp && new Date(m.timestamp) >= cutoff);
              // ensure most recent first
              recent.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

              const groups = recent.reduce<Record<string, Meal[]>>((acc, meal) => {
                const d = new Date(meal.timestamp || 0);
                const key = d.toISOString().slice(0, 10);
                if (!acc[key]) acc[key] = [];
                acc[key].push(meal);
                return acc;
              }, {});

              const grouped = Object.keys(groups)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map((k) => ({ date: k, meals: groups[k] }));

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {grouped.map((group) => (
                    <div key={group.date}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 8 }}>{new Date(group.date).toLocaleDateString()}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {group.meals.map((meal) => {
                          const totalCals = meal.foods.reduce((sum, f) => sum + toNumber(f.calories), 0);
                          const totalProtein = meal.foods.reduce((sum, f) => sum + toNumber(f.protein), 0);
                          const totalCarbs = meal.foods.reduce((sum, f) => sum + toNumber(f.carbs), 0);
                          const totalFat = meal.foods.reduce((sum, f) => sum + toNumber(f.fat), 0);

                          return (
                            <div key={meal.id} style={{ padding: '12px', backgroundColor: theme.bgSecondary, borderRadius: 6, border: `1px solid ${theme.border}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{meal.name}</div>
                                  <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>{Math.round(totalCals)}cal • {Math.round(totalProtein)}p • {Math.round(totalCarbs)}c • {Math.round(totalFat)}f</div>
                                  <div style={{ fontSize: 11, color: theme.textMuted, fontStyle: 'italic' }}>{meal.foods.length} item{meal.foods.length !== 1 ? 's' : ''}</div>
                                </div>
                                <div style={{ position: 'relative', display: 'flex', gap: 6 }}>
                                  <button aria-label="Edit meal" onClick={() => startEditingMeal(meal)} style={{ padding: '6px 12px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.primaryDark)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.primary)}><span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>✎</span></button>
                                  <button aria-label="Delete meal" onClick={() => setDeleteConfirmMealId(meal.id)} style={{ padding: '6px 12px', backgroundColor: theme.error, color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>🗑</button>

                                  {deleteConfirmMealId === meal.id && (
                                    <div style={{ position: 'absolute', top: 36, right: 0, backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 2, minWidth: 170 }}>
                                      <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>Delete this meal?</div>
                                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={() => setDeleteConfirmMealId(null)} style={{ padding: '6px 8px', backgroundColor: theme.bgTertiary, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                        <button type="button" aria-label="Confirm delete meal" onClick={() => { deleteMealEntry(meal.id); setDeleteConfirmMealId(null); }} style={{ padding: '6px 8px', backgroundColor: theme.error, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>🗑</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <details style={{ marginTop: 8 }}>
                                <summary style={{ fontSize: 11, color: isDark ? theme.primary : '#3182ce', cursor: 'pointer', fontWeight: 500, userSelect: 'none' }}>Show Foods</summary>
                                <div style={{ marginTop: 8, paddingLeft: 12 }}>{meal.foods.map((food, idx) => (<div key={idx} style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>• {food.foodName} ({toNumber(food.calories)}cal, {toNumber(food.protein)}p, {toNumber(food.carbs)}c, {toNumber(food.fat)}f)</div>))}</div>
                              </details>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Macro Summary */}
      <div style={{ marginTop: 16, padding: 16, backgroundColor: isDark ? theme.bgTertiary : 'white', borderRadius: 6, border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
          <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? theme.textMuted : '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Macro Summary</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => changePeriod('daily')}
              style={{
                padding: '8px 12px',
                backgroundColor: period === 'daily' ? macroPeriodAccent : theme.bg,
                color: period === 'daily' ? theme.bg : theme.text,
                border: `1px solid ${period === 'daily' ? macroPeriodAccent : theme.border}`,
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: period === 'daily' ? macroPeriodAccentGlow : 'none',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = macroPeriodAccentGlow;
                e.currentTarget.style.borderColor = macroPeriodAccent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = period === 'daily' ? macroPeriodAccentGlow : 'none';
                e.currentTarget.style.borderColor = period === 'daily' ? macroPeriodAccent : theme.border;
              }}
            >
              Daily
            </button>
            <button
              onClick={() => changePeriod('weekly')}
              style={{
                padding: '8px 12px',
                backgroundColor: period === 'weekly' ? macroPeriodAccent : theme.bg,
                color: period === 'weekly' ? theme.bg : theme.text,
                border: `1px solid ${period === 'weekly' ? macroPeriodAccent : theme.border}`,
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: period === 'weekly' ? macroPeriodAccentGlow : 'none',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = macroPeriodAccentGlow;
                e.currentTarget.style.borderColor = macroPeriodAccent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = period === 'weekly' ? macroPeriodAccentGlow : 'none';
                e.currentTarget.style.borderColor = period === 'weekly' ? macroPeriodAccent : theme.border;
              }}
            >
              Weekly
            </button>
            <button
              onClick={() => changePeriod('monthly')}
              style={{
                padding: '8px 12px',
                backgroundColor: period === 'monthly' ? macroPeriodAccent : theme.bg,
                color: period === 'monthly' ? theme.bg : theme.text,
                border: `1px solid ${period === 'monthly' ? macroPeriodAccent : theme.border}`,
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: period === 'monthly' ? macroPeriodAccentGlow : 'none',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = macroPeriodAccentGlow;
                e.currentTarget.style.borderColor = macroPeriodAccent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = period === 'monthly' ? macroPeriodAccentGlow : 'none';
                e.currentTarget.style.borderColor = period === 'monthly' ? macroPeriodAccent : theme.border;
              }}
            >
              Monthly
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{ fontSize: 14, color: isDark ? theme.textMuted : '#718096' }}>Loading...</div>
        ) : typedSummary ? (
          <div key={period} className="tab-swap-fade">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80 }}>
                  <ProgressRing 
                    value={period === 'weekly' ? toNumber(typedSummary.avgCalories) : toNumber(typedSummary.totalCalories)} 
                    max={calorieGoal?.calories || 2000} 
                    color="#f56565"
                    size={80}
                  />
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                      {period === 'weekly' ? Math.round(toNumber(typedSummary.avgCalories)) : toNumber(typedSummary.totalCalories)}
                    </div>
                    <div style={{ fontSize: 9, color: isDark ? theme.textMuted : '#718096' }}>kcal</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calories</div>
                  <div style={{ fontSize: 13, color: isDark ? theme.textSecondary : '#718096' }}>
                    {period === 'weekly' ? Math.round(toNumber(typedSummary.avgCalories)) : toNumber(typedSummary.totalCalories)} / {calorieGoal?.calories || 2000} kcal
                  </div>
                </div>
              </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80 }}>
                <ProgressRing 
                  value={period === 'weekly' ? toNumber(typedSummary.avgProtein) : toNumber(typedSummary.totalProtein)} 
                  max={150} 
                  color="#48bb78"
                  size={80}
                />
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                    {period === 'weekly' ? Math.round(toNumber(typedSummary.avgProtein)) : toNumber(typedSummary.totalProtein)}
                  </div>
                  <div style={{ fontSize: 9, color: isDark ? theme.textMuted : '#718096' }}>g</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protein</div>
                <div style={{ fontSize: 13, color: isDark ? theme.textSecondary : '#718096' }}>
                  {period === 'weekly' ? Math.round(toNumber(typedSummary.avgProtein)) : toNumber(typedSummary.totalProtein)} / 150 g
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80 }}>
                <ProgressRing 
                  value={period === 'weekly' ? toNumber(typedSummary.avgCarbs) : toNumber(typedSummary.totalCarbs)} 
                  max={250} 
                  color="#4299e1"
                  size={80}
                />
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                    {period === 'weekly' ? Math.round(toNumber(typedSummary.avgCarbs)) : toNumber(typedSummary.totalCarbs)}
                  </div>
                  <div style={{ fontSize: 9, color: isDark ? theme.textMuted : '#718096' }}>g</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Carbs</div>
                <div style={{ fontSize: 13, color: isDark ? theme.textSecondary : '#718096' }}>
                  {period === 'weekly' ? Math.round(toNumber(typedSummary.avgCarbs)) : toNumber(typedSummary.totalCarbs)} / 250 g
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80 }}>
                <ProgressRing 
                  value={period === 'weekly' ? toNumber(typedSummary.avgFat) : toNumber(typedSummary.totalFat)} 
                  max={65} 
                  color="#ed8936"
                  size={80}
                />
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? theme.text : '#1a202c' }}>
                    {period === 'weekly' ? Math.round(toNumber(typedSummary.avgFat)) : toNumber(typedSummary.totalFat)}
                  </div>
                  <div style={{ fontSize: 9, color: isDark ? theme.textMuted : '#718096' }}>g</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#a0aec0', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fat</div>
                <div style={{ fontSize: 13, color: isDark ? theme.textSecondary : '#718096' }}>
                  {period === 'weekly' ? Math.round(toNumber(typedSummary.avgFat)) : toNumber(typedSummary.totalFat)} / 65 g
                </div>
              </div>
            </div>
          </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: isDark ? theme.textMuted : '#718096' }}>No data available</div>
        )}
        <div style={{ fontSize: 12, color: isDark ? theme.textMuted : '#a0aec0', marginTop: 12, paddingTop: 12, borderTop: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0' }}>
          {typedSummary && (toNumber(typedSummary.entryCount) || 0)} {period === 'daily' ? 'entries' : 'entries tracked'} {period === 'weekly' && `over ${toNumber(typedSummary?.days) || 0} days`}
        </div>
      </div>
    </div>
  );
}
