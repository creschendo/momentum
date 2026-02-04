let splits = [];
let nextSplitId = 1;
let nextDayId = 1;
let nextLiftId = 1;
let nextCardioId = 1;

// Create a new split
export function addSplit(splitData) {
  const daysCount = Math.max(Number(splitData.days ?? splitData.daysCount ?? 1), 1);
  const days = Array.from({ length: daysCount }, (_, index) => ({
    id: nextDayId++,
    name: `Day ${index + 1}`,
    lifts: [],
    cardio: []
  }));
  const split = {
    id: nextSplitId++,
    ...splitData,
    daysCount,
    days,
    createdAt: new Date().toISOString()
  };
  splits.push(split);
  return split;
}

// Get all splits
function ensureDays(split) {
  const daysCount = Number(split.daysCount ?? split.days ?? 0);
  if (!Number.isFinite(daysCount) || daysCount <= 0) return split;
  if (!Array.isArray(split.days)) {
    split.days = [];
  }
  while (split.days.length < daysCount) {
    split.days.push({
      id: nextDayId++,
      name: `Day ${split.days.length + 1}`,
      lifts: [],
      cardio: []
    });
  }
  return split;
}

export function getSplits() {
  splits.forEach(ensureDays);
  return splits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Get a single split
export function getSplit(id) {
  const split = splits.find(s => s.id === Number(id));
  if (!split) return null;
  return ensureDays(split);
}

// Update a split
export function updateSplit(id, updates) {
  const split = getSplit(id);
  if (!split) return null;
  
  // Handle daysCount updates - add or remove days as needed
  if (updates.daysCount !== undefined) {
    const newDaysCount = Math.max(Number(updates.daysCount), 1);
    const currentDaysCount = split.days?.length || 0;
    
    if (newDaysCount > currentDaysCount) {
      // Add new days
      for (let i = currentDaysCount; i < newDaysCount; i++) {
        split.days.push({
          id: nextDayId++,
          name: `Day ${i + 1}`,
          lifts: [],
          cardio: []
        });
      }
    } else if (newDaysCount < currentDaysCount) {
      // Remove days from the end
      split.days = split.days.slice(0, newDaysCount);
    }
    
    split.daysCount = newDaysCount;
  }
  
  // Apply other updates
  Object.assign(split, updates);
  return split;
}

// Delete a split
export function deleteSplit(id) {
  const index = splits.findIndex(s => s.id === Number(id));
  if (index === -1) return false;
  splits.splice(index, 1);
  return true;
}

// Add day to split
export function addDayToSplit(splitId, dayData) {
  const split = getSplit(splitId);
  if (!split) return null;
  const day = {
    id: nextDayId++,
    ...dayData,
    lifts: [],
    cardio: []
  };
  split.days.push(day);
  return day;
}

// Update day in split
export function updateDayInSplit(splitId, dayId, updates) {
  const split = getSplit(splitId);
  if (!split) return null;
  const day = split.days.find(d => d.id === Number(dayId));
  if (!day) return null;
  Object.assign(day, updates);
  return day;
}

// Remove day from split
export function removeDayFromSplit(splitId, dayId) {
  const split = getSplit(splitId);
  if (!split) return false;
  const index = split.days.findIndex(d => d.id === Number(dayId));
  if (index === -1) return false;
  split.days.splice(index, 1);
  return true;
}

// Add lift to day
export function addLiftToDay(splitId, dayId, lift) {
  const split = getSplit(splitId);
  if (!split) return null;
  const day = split.days.find(d => d.id === Number(dayId));
  if (!day) return null;
  const liftWithId = { id: nextLiftId++, ...lift };
  day.lifts.push(liftWithId);
  return liftWithId;
}

// Update lift in day
export function updateLiftInDay(splitId, dayId, liftId, updates) {
  const split = getSplit(splitId);
  if (!split) return null;
  const day = split.days.find(d => d.id === Number(dayId));
  if (!day) return null;
  const lift = day.lifts.find(l => l.id === Number(liftId));
  if (!lift) return null;
  Object.assign(lift, updates);
  return lift;
}

// Remove lift from day
export function removeLiftFromDay(splitId, dayId, liftId) {
  const split = getSplit(splitId);
  if (!split) return false;
  const day = split.days.find(d => d.id === Number(dayId));
  if (!day) return false;
  const index = day.lifts.findIndex(l => l.id === Number(liftId));
  if (index === -1) return false;
  day.lifts.splice(index, 1);
  return true;
}

// Add cardio to day
export function addCardioToDay(splitId, dayId, cardio) {
  const split = getSplit(splitId);
  if (!split) return null;
  const day = split.days.find(d => d.id === Number(dayId));
  if (!day) return null;
  const cardioWithId = { id: nextCardioId++, ...cardio };
  day.cardio.push(cardioWithId);
  return cardioWithId;
}

// Update cardio in day
export function updateCardioInDay(splitId, dayId, cardioId, updates) {
  const split = getSplit(splitId);
  if (!split) return null;
  const day = split.days.find(d => d.id === Number(dayId));
  if (!day) return null;
  const cardioSession = day.cardio.find(c => c.id === Number(cardioId));
  if (!cardioSession) return null;
  Object.assign(cardioSession, updates);
  return cardioSession;
}

// Remove cardio from day
export function removeCardioFromDay(splitId, dayId, cardioId) {
  const split = getSplit(splitId);
  if (!split) return false;
  const day = split.days.find(d => d.id === Number(dayId));
  if (!day) return false;
  const index = day.cardio.findIndex(c => c.id === Number(cardioId));
  if (index === -1) return false;
  day.cardio.splice(index, 1);
  return true;
}
