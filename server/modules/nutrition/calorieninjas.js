import axios from 'axios';

// CalorieNinjas API wrapper for nutrition data.
// Requires environment variable:
// - CALORIENINJAS_API_KEY
//
// Get your free API key at https://calorieninjas.com/api
// Note: Do NOT commit your real key. Use a .env file locally and a secrets manager in production.

const API_KEY = process.env.CALORIENINJAS_API_KEY;

const BASE = 'https://api.calorieninjas.com/v1';

function ensureKeys() {
  if (!API_KEY) {
    throw new Error('CalorieNinjas API key not configured. Set CALORIENINJAS_API_KEY in environment.');
  }
}

async function searchInstant(query) {
  // CalorieNinjas nutrition endpoint: GET /nutrition?query=QUERY
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
  const items = res.data.items || [];
  
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

// CalorieNinjas doesn't have separate endpoints, so these all use the same search
async function naturalLanguage(query) {
  return searchInstant(query);
}

// Calculate TDEE (Total Daily Energy Expenditure) and BMR
// Using Mifflin-St Jeor equation (no external API call needed)
// Parameters:
// - age: number (years)
// - sex: string ('male' or 'female')
// - height_cm: number (centimeters)
// - weight_kg: number (kilograms)
// - activity_level: number (1.375, 1.55, 1.725, or 1.9)
async function calculateTDEE({ age, sex, height_cm, weight_kg, activity_level }) {
  // Mifflin-St Jeor equation for BMR
  let bmr;
  if (sex === 'male') {
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
  } else {
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
  }
  
  bmr = Math.round(bmr);
  const tdee = Math.round(bmr * activity_level);
  
  // Calculate calorie targets for different goals (based on caloriecalculator.net)
  // Deficits are based on 1 lb = ~3,500 calories
  const calorieTargets = {
    maintain: tdee,
    mildWeightLoss: Math.max(1200, Math.round(tdee - 250)),      // ~0.5 lb/week loss
    weightLoss: Math.max(1200, Math.round(tdee - 500)),          // ~1 lb/week loss
    extremeWeightLoss: Math.max(1200, Math.round(tdee - 750))    // ~1.5 lb/week loss (enforce 1200 min for safety)
  };
  
  // Calculate macro distribution based on maintain TDEE
  // Protein: 1.8g per kg of body weight (good for muscle building/maintenance)
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
