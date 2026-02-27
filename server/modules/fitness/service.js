import pool from '../../db.js';

// Helper to fetch a split with all its data
async function fetchSplitWithDays({ userId, splitId }) {
  const splitResult = await pool.query(
    'SELECT id, name, description, days_count as "daysCount", created_at as "createdAt" FROM splits WHERE id = $1 AND user_id = $2',
    [splitId, userId]
  );
  
  if (splitResult.rows.length === 0) return null;
  
  const split = splitResult.rows[0];
  
  // Fetch all days for this split
  const daysResult = await pool.query(
    `SELECT sd.id, sd.day_number as "dayNumber", sd.day_name as "dayName"
     FROM split_days sd
     WHERE sd.split_id = $1
     ORDER BY sd.day_number ASC`,
    [splitId]
  );
  
  split.days = await Promise.all(daysResult.rows.map(async (day) => {
    // Fetch lifts for this day
    const liftsResult = await pool.query(
      `SELECT id, exercise_name as "exerciseName", sets, reps, weight FROM lifts WHERE day_id = $1`,
      [day.id]
    );
    
    // Fetch cardio for this day
    const cardioResult = await pool.query(
      `SELECT id, exercise_name as "exerciseName", duration_minutes as "durationMinutes", intensity FROM cardio WHERE day_id = $1`,
      [day.id]
    );
    
    return {
      id: day.id,
      name: day.dayName || `Day ${day.dayNumber}`,
      lifts: liftsResult.rows,
      cardio: cardioResult.rows
    };
  }));
  
  return split;
}

// Create a new split
export async function addSplit({ userId, ...splitData }) {
  const daysCount = Math.max(Number(splitData.days ?? splitData.daysCount ?? 1), 0);
  const now = new Date();
  
  const splitResult = await pool.query(
    'INSERT INTO splits (user_id, name, description, days_count, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, days_count as "daysCount", created_at as "createdAt"',
    [userId, splitData.name || '', splitData.description || '', daysCount, now]
  );
  
  const split = splitResult.rows[0];
  split.days = [];
  
  // Create days for this split
  for (let i = 1; i <= daysCount; i++) {
    const dayResult = await pool.query(
      'INSERT INTO split_days (split_id, day_number, day_name) VALUES ($1, $2, $3) RETURNING id',
      [split.id, i, `Day ${i}`]
    );
    split.days.push({
      id: dayResult.rows[0].id,
      name: `Day ${i}`,
      lifts: [],
      cardio: []
    });
  }
  
  return split;
}

// Get all splits
export async function getSplits({ userId }) {
  const splitsResult = await pool.query(
    'SELECT id, name, description, days_count as "daysCount", created_at as "createdAt" FROM splits WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  );
  
  return Promise.all(splitsResult.rows.map(async (split) => {
    return fetchSplitWithDays({ userId, splitId: split.id });
  }));
}

// Get a single split
export async function getSplit({ userId, id }) {
  return fetchSplitWithDays({ userId, splitId: id });
}

// Update a split
export async function updateSplit({ userId, id, updates }) {
  const split = await getSplit({ userId, id });
  if (!split) return null;
  
  // Update split metadata
  if (updates.name !== undefined || updates.description !== undefined) {
    await pool.query(
      'UPDATE splits SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 AND user_id = $4',
      [updates.name, updates.description, id, userId]
    );
  }
  
  // Handle daysCount updates
  if (updates.daysCount !== undefined) {
    const newDaysCount = Math.max(Number(updates.daysCount), 1);
    const currentDaysCount = split.days.length;
    
    if (newDaysCount > currentDaysCount) {
      // Add new days
      for (let i = currentDaysCount + 1; i <= newDaysCount; i++) {
        await pool.query(
          'INSERT INTO split_days (split_id, day_number, day_name) VALUES ($1, $2, $3)',
          [id, i, `Day ${i}`]
        );
      }
    } else if (newDaysCount < currentDaysCount) {
      // Remove days from the end
      const daysToRemove = split.days.slice(newDaysCount);
      for (const day of daysToRemove) {
        await pool.query('DELETE FROM split_days WHERE id = $1', [day.id]);
      }
    }
    
    await pool.query('UPDATE splits SET days_count = $1 WHERE id = $2', [newDaysCount, id]);
  }
  
  return fetchSplitWithDays({ userId, splitId: id });
}

// Delete a split
export async function deleteSplit({ userId, id }) {
  const result = await pool.query('DELETE FROM splits WHERE user_id = $1 AND id = $2', [userId, id]);
  return result.rowCount > 0;
}

// Add day to split
export async function addDayToSplit({ userId, splitId, dayData }) {
  const split = await getSplit({ userId, id: splitId });
  if (!split) return null;
  
  const nextDayNumber = split.days.length + 1;
  const dayName = dayData?.name || `Day ${nextDayNumber}`;
  
  const result = await pool.query(
    'INSERT INTO split_days (split_id, day_number, day_name) VALUES ($1, $2, $3) RETURNING id',
    [splitId, nextDayNumber, dayName]
  );
  
  return {
    id: result.rows[0].id,
    name: dayName,
    lifts: [],
    cardio: []
  };
}

// Update day in split
export async function updateDayInSplit({ userId, splitId, dayId, updates }) {
  const result = await pool.query(
    `UPDATE split_days
     SET day_name = COALESCE($1, day_name)
     WHERE id = $2
       AND split_id = $3
       AND split_id IN (SELECT id FROM splits WHERE user_id = $4)
     RETURNING id, day_name as "dayName"`,
    [updates.name, dayId, splitId, userId]
  );
  
  if (result.rows.length === 0) return null;
  
  return {
    id: result.rows[0].id,
    name: result.rows[0].dayName,
    lifts: [],
    cardio: []
  };
}

// Remove day from split
export async function removeDayFromSplit({ userId, splitId, dayId }) {
  const result = await pool.query(
    `DELETE FROM split_days
     WHERE id = $1
       AND split_id = $2
       AND split_id IN (SELECT id FROM splits WHERE user_id = $3)`,
    [dayId, splitId, userId]
  );
  return result.rowCount > 0;
}

// Add lift to day
export async function addLiftToDay({ userId, splitId, dayId, lift }) {
  // Verify day exists and belongs to split
  const dayCheck = await pool.query(
    `SELECT sd.id
     FROM split_days sd
     JOIN splits s ON s.id = sd.split_id
     WHERE sd.id = $1 AND sd.split_id = $2 AND s.user_id = $3`,
    [dayId, splitId, userId]
  );
  
  if (dayCheck.rows.length === 0) return null;
  
  const result = await pool.query(
    'INSERT INTO lifts (day_id, exercise_name, sets, reps, weight) VALUES ($1, $2, $3, $4, $5) RETURNING id, exercise_name as "exerciseName", sets, reps, weight',
    [dayId, lift.exerciseName || '', lift.sets, lift.reps, lift.weight]
  );
  
  return result.rows[0];
}

// Update lift in day
export async function updateLiftInDay({ userId, splitId, dayId, liftId, updates }) {
  const result = await pool.query(
    `UPDATE lifts SET exercise_name = COALESCE($1, exercise_name), sets = COALESCE($2, sets), 
     reps = COALESCE($3, reps), weight = COALESCE($4, weight)
     WHERE id = $5
       AND day_id = $6
       AND day_id IN (
         SELECT sd.id
         FROM split_days sd
         JOIN splits s ON s.id = sd.split_id
         WHERE sd.split_id = $7 AND s.user_id = $8
       )
     RETURNING id, exercise_name as "exerciseName", sets, reps, weight`,
    [updates.exerciseName, updates.sets, updates.reps, updates.weight, liftId, dayId, splitId, userId]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

// Remove lift from day
export async function removeLiftFromDay({ userId, splitId, dayId, liftId }) {
  const result = await pool.query(
    `DELETE FROM lifts
     WHERE id = $1
       AND day_id = $2
       AND day_id IN (
         SELECT sd.id
         FROM split_days sd
         JOIN splits s ON s.id = sd.split_id
         WHERE sd.split_id = $3 AND s.user_id = $4
       )`,
    [liftId, dayId, splitId, userId]
  );
  return result.rowCount > 0;
}

// Add cardio to day
export async function addCardioToDay({ userId, splitId, dayId, cardio }) {
  // Verify day exists and belongs to split
  const dayCheck = await pool.query(
    `SELECT sd.id
     FROM split_days sd
     JOIN splits s ON s.id = sd.split_id
     WHERE sd.id = $1 AND sd.split_id = $2 AND s.user_id = $3`,
    [dayId, splitId, userId]
  );
  
  if (dayCheck.rows.length === 0) return null;
  
  const result = await pool.query(
    'INSERT INTO cardio (day_id, exercise_name, duration_minutes, intensity) VALUES ($1, $2, $3, $4) RETURNING id, exercise_name as "exerciseName", duration_minutes as "durationMinutes", intensity',
    [dayId, cardio.exerciseName || '', cardio.durationMinutes, cardio.intensity]
  );
  
  return result.rows[0];
}

// Update cardio in day
export async function updateCardioInDay({ userId, splitId, dayId, cardioId, updates }) {
  const result = await pool.query(
    `UPDATE cardio SET exercise_name = COALESCE($1, exercise_name), duration_minutes = COALESCE($2, duration_minutes), 
     intensity = COALESCE($3, intensity)
     WHERE id = $4
       AND day_id = $5
       AND day_id IN (
         SELECT sd.id
         FROM split_days sd
         JOIN splits s ON s.id = sd.split_id
         WHERE sd.split_id = $6 AND s.user_id = $7
       )
     RETURNING id, exercise_name as "exerciseName", duration_minutes as "durationMinutes", intensity`,
    [updates.exerciseName, updates.durationMinutes, updates.intensity, cardioId, dayId, splitId, userId]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

// Remove cardio from day
export async function removeCardioFromDay({ userId, splitId, dayId, cardioId }) {
  const result = await pool.query(
    `DELETE FROM cardio
     WHERE id = $1
       AND day_id = $2
       AND day_id IN (
         SELECT sd.id
         FROM split_days sd
         JOIN splits s ON s.id = sd.split_id
         WHERE sd.split_id = $3 AND s.user_id = $4
       )`,
    [cardioId, dayId, splitId, userId]
  );
  return result.rowCount > 0;
}
