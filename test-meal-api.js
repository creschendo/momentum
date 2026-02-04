// Quick test script for the meal API
const baseUrl = 'http://localhost:4000';

async function testMealAPI() {
  console.log('🧪 Testing Meal API...\n');

  try {
    // 1. Create a meal
    console.log('1️⃣  Creating a test meal...');
    const mealData = {
      name: 'Test Breakfast',
      foods: [
        { foodName: 'Eggs (200g)', calories: 300, protein: 24, carbs: 2, fat: 20 },
        { foodName: 'Toast (100g)', calories: 250, protein: 8, carbs: 45, fat: 3 }
      ]
    };

    const createRes = await fetch(`${baseUrl}/api/nutrition/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mealData)
    });

    if (!createRes.ok) {
      throw new Error(`Create meal failed: ${createRes.status}`);
    }

    const createdMeal = await createRes.json();
    console.log('✅ Meal created:', createdMeal);
    console.log('');

    // 2. Get all meals
    console.log('2️⃣  Fetching all meals...');
    const getMealsRes = await fetch(`${baseUrl}/api/nutrition/meals`);
    
    if (!getMealsRes.ok) {
      throw new Error(`Get meals failed: ${getMealsRes.status}`);
    }

    const meals = await getMealsRes.json();
    console.log(`✅ Found ${meals.length} meal(s)`);
    console.log('');

    // 3. Get macro summary
    console.log('3️⃣  Fetching macro summary...');
    const summaryRes = await fetch(`${baseUrl}/api/nutrition/foods/summary?period=daily`);
    
    if (!summaryRes.ok) {
      throw new Error(`Get summary failed: ${summaryRes.status}`);
    }

    const summary = await summaryRes.json();
    console.log('✅ Macro Summary:', summary);
    console.log('');

    // 4. Delete the test meal
    console.log('4️⃣  Deleting test meal...');
    const deleteRes = await fetch(`${baseUrl}/api/nutrition/meals/${createdMeal.id}`, {
      method: 'DELETE'
    });

    if (!deleteRes.ok) {
      throw new Error(`Delete meal failed: ${deleteRes.status}`);
    }

    const deleteResult = await deleteRes.json();
    console.log('✅ Meal deleted:', deleteResult.message);
    console.log('');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMealAPI();
