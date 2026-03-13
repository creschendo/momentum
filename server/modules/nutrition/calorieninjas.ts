import axios from 'axios';
import type { NutritionSearchResult, NaturalLanguageResult, TdeeRequest, TdeeResult } from '../../types.js';

interface CalorieNinjaItem {
  name?: string;
  serving_size_g?: number;
  calories?: number;
  protein_g?: number;
  carbohydrates_total_g?: number;
  fat_total_g?: number;
}

interface CalorieNinjaResponse {
  items?: CalorieNinjaItem[];
}

// CalorieNinjas API wrapper for nutrition data.
// Requires environment variable:
// - CALORIENINJAS_API_KEY
//
// Get your free API key at https://calorieninjas.com/api
// Note: Do NOT commit your real key. Use a .env file locally and a secrets manager in production.

const API_KEY = process.env.CALORIENINJAS_API_KEY;
const BASE = 'https://api.calorieninjas.com/v1';

/** Throws an error if the CALORIENINJAS_API_KEY environment variable is not
 *  set. Call this at the start of any function that makes an API request. */
function ensureKeys(): void {
  if (!API_KEY) {
    throw new Error('CalorieNinjas API key not configured. Set CALORIENINJAS_API_KEY in environment.');
  }
}

/** Queries the CalorieNinjas /nutrition endpoint with a free-text food query
 *  and maps the response items to the shared NutritionSearchResult format,
 *  normalizing field names (e.g. protein_g → nf_protein). */
async function searchInstant(query: string): Promise<NutritionSearchResult> {
  ensureKeys();
  const url = `${BASE}/nutrition`;
  const res = await axios.get(url, {
    params: { query },
    headers: {
      'X-Api-Key': API_KEY
    }
  });

  // Transform CalorieNinjas response to match expected format
  // CalorieNinjas returns: items[] with name, calories, protein_g, carbohydrates_total_g, fat_total_g, serving_size_g
  const payload = (res.data || {}) as CalorieNinjaResponse;
  const items = payload.items || [];

  return {
    common: items.map(item => ({
      food_name: item.name,
      serving_weight_grams: item.serving_size_g || 100,
      nf_calories: item.calories || 0,
      nf_protein: item.protein_g || 0,
      nf_total_carbohydrate: item.carbohydrates_total_g || 0,
      nf_total_fat: item.fat_total_g || 0
    }))
  };
}

/** Alias for searchInstant that satisfies the NaturalLanguageResult type.
 *  CalorieNinjas uses a single /nutrition endpoint for all query styles, so
 *  both structured and natural-language queries are handled identically. */
async function naturalLanguage(query: string): Promise<NaturalLanguageResult> {
  return searchInstant(query);
}

/** Calculates BMR via the Mifflin-St Jeor equation and multiplies by the
 *  activity_level multiplier to get TDEE. Returns calorie targets for
 *  maintenance, mild loss (−250 kcal), moderate loss (−500 kcal), and
 *  extreme loss (−750 kcal, min 1200), plus recommended macros based on
 *  1.8 g/kg protein with remaining calories split 45/55 carbs/fat. */
async function calculateTDEE({ age, sex, height_cm, weight_kg, activity_level }: TdeeRequest): Promise<TdeeResult> {
  // Mifflin-St Jeor equation for BMR
  let bmr: number;
  if (sex === 'male') {
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
  } else {
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
  }

  bmr = Math.round(bmr);
  const tdee = Math.round(bmr * activity_level);

  // Deficits are based on 1 lb = ~3,500 calories
  const calorieTargets = {
    maintain: tdee,
    mildWeightLoss: Math.max(1200, Math.round(tdee - 250)),      // ~0.5 lb/week loss
    weightLoss: Math.max(1200, Math.round(tdee - 500)),          // ~1 lb/week loss
    extremeWeightLoss: Math.max(1200, Math.round(tdee - 750))    // ~1.5 lb/week loss (enforce 1200 min for safety)
  };

  // Protein: 1.8g per kg of body weight
  // Carbs: 45% of remaining calories
  // Fat: 55% of remaining calories
  const proteinG = weight_kg * 1.8;
  const proteinCals = proteinG * 4;
  const remainingCals = tdee - proteinCals;
  const carbsCals = remainingCals * 0.45;
  const fatCals = remainingCals * 0.55;

  return {
    bmr,
    tdee,
    calorieTargets,
    macros: {
      protein_g: Math.round(proteinG),
      carbs_g: Math.round(carbsCals / 4),
      fat_g: Math.round(fatCals / 9)
    }
  };
}

export default { searchInstant, naturalLanguage, calculateTDEE, ensureKeys };
