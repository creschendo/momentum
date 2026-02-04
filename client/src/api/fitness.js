async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function getSplits() {
  const res = await fetch('/api/fitness/splits');
  const data = await safeJson(res);
  return Array.isArray(data) ? data : [];
}

export async function getSplit(id) {
  const res = await fetch(`/api/fitness/splits/${id}`);
  return safeJson(res);
}

export async function createSplit(title, days) {
  const res = await fetch('/api/fitness/splits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, days })
  });
  return safeJson(res);
}

export async function updateSplit(id, updates) {
  const res = await fetch(`/api/fitness/splits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson(res);
}

export async function deleteSplit(id) {
  const res = await fetch(`/api/fitness/splits/${id}`, {
    method: 'DELETE'
  });
  return safeJson(res);
}

export async function addDay(splitId, name) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return safeJson(res);
}

export async function updateDay(splitId, dayId, updates) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson(res);
}

export async function deleteDay(splitId, dayId) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}`, {
    method: 'DELETE'
  });
  return safeJson(res);
}

export async function addLift(splitId, dayId, lift) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lift)
  });
  return safeJson(res);
}

export async function updateLift(splitId, dayId, liftId, updates) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts/${liftId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson(res);
}

export async function deleteLift(splitId, dayId, liftId) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts/${liftId}`, {
    method: 'DELETE'
  });
  return safeJson(res);
}

export async function addCardio(splitId, dayId, cardio) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardio)
  });
  return safeJson(res);
}

export async function updateCardio(splitId, dayId, cardioId, updates) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio/${cardioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson(res);
}

export async function deleteCardio(splitId, dayId, cardioId) {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio/${cardioId}`, {
    method: 'DELETE'
  });
  return safeJson(res);
}
