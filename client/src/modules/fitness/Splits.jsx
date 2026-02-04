import React, { useState } from 'react';
import useSplits from './hooks/useSplits';
import { useTheme } from '../../context/ThemeContext';

const CARDIO_TYPES = ['Treadmill', 'Bike', 'Stairmaster', 'Rowing Machine', 'Elliptical'];

export default function Splits() {
  const { splits, loading, error, createSplit, updateSplit, deleteSplit, updateDay, addLift, updateLift, deleteLift, addCardio, updateCardio, deleteCardio } = useSplits();
  const { theme } = useTheme();

  const [splitTitle, setSplitTitle] = useState('');
  const [expandedSplit, setExpandedSplit] = useState(null);
  const [days, setDays] = useState(1);
  const [expandedDay, setExpandedDay] = useState(null);
  
  // Lift forms state
  const [liftForms, setLiftForms] = useState({});
  
  // Cardio forms state
  const [cardioForms, setCardioForms] = useState({});

  // Edit mode state
  const [editingLift, setEditingLift] = useState(null);
  const [editingCardio, setEditingCardio] = useState(null);
  const [editingSplitId, setEditingSplitId] = useState(null);
  const [editingSplitTitle, setEditingSplitTitle] = useState('');
  const [editingDaysCount, setEditingDaysCount] = useState(1);
  const [editingDayKey, setEditingDayKey] = useState(null);
  const [editingDayName, setEditingDayName] = useState('');
  
  // Form open/close state
  const [openLiftForm, setOpenLiftForm] = useState(null); // splitId-dayId
  const [openCardioForm, setOpenCardioForm] = useState(null); // splitId-dayId

  const handleCreateSplit = async (e) => {
    e.preventDefault();
    if (!splitTitle.trim()) return;
    try {
      await createSplit(splitTitle, Number(days));
      setSplitTitle('');
      setDays(1);
    } catch (err) {
      console.error('Failed to create split:', err);
    }
  };

  const handleDeleteDay = async () => {};

  const handleStartEditSplit = (split) => {
    setEditingSplitId(split.id);
    setEditingSplitTitle(split.title || '');
    setEditingDaysCount(split.days?.length || 1);
  };

  const handleSaveSplit = async (splitId) => {
    if (!editingSplitTitle.trim()) return;
    try {
      await updateSplit(splitId, { title: editingSplitTitle.trim(), daysCount: editingDaysCount });
      setEditingSplitId(null);
      setEditingSplitTitle('');
      setEditingDaysCount(1);
    } catch (err) {
      console.error('Failed to update split:', err);
    }
  };

  const handleStartEditDay = (day) => {
    setEditingDayKey(day.id);
    setEditingDayName(day.name || '');
  };

  const handleSaveDay = async (splitId, dayId) => {
    if (!editingDayName.trim()) return;
    try {
      await updateDay(splitId, dayId, { name: editingDayName.trim() });
      setEditingDayKey(null);
      setEditingDayName('');
    } catch (err) {
      console.error('Failed to update day:', err);
    }
  };

  const handleAddLift = async (splitId, dayId, e) => {
    e.preventDefault();
    const formKey = `${splitId}-${dayId}`;
    const form = liftForms[formKey];
    if (!form?.name?.trim()) return;

    try {
      await addLift(splitId, dayId, {
        name: form.name,
        weight: form.weight || '',
        sets: parseInt(form.sets) || 3,
        reps: parseInt(form.reps) || 8
      });
      setLiftForms({ ...liftForms, [formKey]: { name: '', weight: '', sets: 3, reps: 8 } });
      setOpenLiftForm(null);
    } catch (err) {
      console.error('Failed to add lift:', err);
    }
  };

  const handleUpdateLift = async (splitId, dayId, liftId) => {
    if (!editingLift) return;
    try {
      await updateLift(splitId, dayId, liftId, editingLift);
      setEditingLift(null);
    } catch (err) {
      console.error('Failed to update lift:', err);
    }
  };

  const handleDeleteLift = async (splitId, dayId, liftId) => {
    try {
      await deleteLift(splitId, dayId, liftId);
      if (editingLift?.id === liftId) setEditingLift(null);
    } catch (err) {
      console.error('Failed to delete lift:', err);
    }
  };

  const handleAddCardio = async (splitId, dayId, e) => {
    e.preventDefault();
    const formKey = `${splitId}-${dayId}`;
    const form = cardioForms[formKey];

    try {
      await addCardio(splitId, dayId, {
        type: form?.type || 'Treadmill',
        speed: parseFloat(form?.speed) || 6,
        incline: parseFloat(form?.incline) || 0,
        duration: parseInt(form?.duration) || 20
      });
      setCardioForms({ ...cardioForms, [formKey]: { type: 'Treadmill', speed: 6, incline: 0, duration: 20 } });
      setOpenCardioForm(null);
    } catch (err) {
      console.error('Failed to add cardio:', err);
    }
  };

  const handleUpdateCardio = async (splitId, dayId, cardioId) => {
    if (!editingCardio) return;
    try {
      await updateCardio(splitId, dayId, cardioId, editingCardio);
      setEditingCardio(null);
    } catch (err) {
      console.error('Failed to update cardio:', err);
    }
  };

  const handleDeleteCardio = async (splitId, dayId, cardioId) => {
    try {
      await deleteCardio(splitId, dayId, cardioId);
      if (editingCardio?.id === cardioId) setEditingCardio(null);
    } catch (err) {
      console.error('Failed to delete cardio:', err);
    }
  };

  const getLiftFormValue = (splitId, dayId, field, defaultValue) => {
    const formKey = `${splitId}-${dayId}`;
    return liftForms[formKey]?.[field] ?? defaultValue;
  };

  const setLiftFormValue = (splitId, dayId, field, value) => {
    const formKey = `${splitId}-${dayId}`;
    setLiftForms({
      ...liftForms,
      [formKey]: {
        ...liftForms[formKey],
        [field]: value
      }
    });
  };

  const getCardioFormValue = (splitId, dayId, field, defaultValue) => {
    const formKey = `${splitId}-${dayId}`;
    return cardioForms[formKey]?.[field] ?? defaultValue;
  };

  const setCardioFormValue = (splitId, dayId, field, value) => {
    const formKey = `${splitId}-${dayId}`;
    setCardioForms({
      ...cardioForms,
      [formKey]: {
        ...cardioForms[formKey],
        [field]: value
      }
    });
  };

  if (loading) return <div style={{ color: theme.textMuted }}>Loading splits...</div>;

  return (
    <div style={{ marginTop: 24, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, color: theme.text }}>Workout Splits</h3>
      
      {error && <div style={{ color: theme.error, marginBottom: 16 }}>{error}</div>}

      {/* Create Split Form */}
      <form onSubmit={handleCreateSplit} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={splitTitle}
            onChange={(e) => setSplitTitle(e.target.value)}
            placeholder="Split name (e.g., Push/Pull/Legs)"
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: theme.bg,
              color: theme.text
            }}
          />
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: theme.bg,
              color: theme.text,
              minWidth: '100px'
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#38a169'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#48bb78'}
          >
            Create Split
          </button>
        </div>
      </form>

      {/* Splits List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {splits.map((split) => (
          <div
            key={split.id}
            style={{
              border: `1.5px solid ${expandedSplit === split.id ? '#0066FF' : theme.border}`,
              borderRadius: 8,
              padding: 16,
              backgroundColor: theme.bgSecondary,
              transition: 'border-color 0.2s'
            }}
          >
            {/* Split Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <button
                  onClick={() => setExpandedSplit(expandedSplit === split.id ? null : split.id)}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: 'transparent',
                    color: theme.text,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    minWidth: '40px'
                  }}
                >
                  {expandedSplit === split.id ? '▼' : '▶'}
                </button>
                {editingSplitId === split.id ? (
                  <div style={{ display: 'flex', gap: 8, flex: 1, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editingSplitTitle}
                      onChange={(e) => setEditingSplitTitle(e.target.value)}
                      placeholder="Split name"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                        fontSize: 14,
                        backgroundColor: theme.bg,
                        color: theme.text
                      }}
                    />
                    <select
                      value={editingDaysCount}
                      onChange={(e) => setEditingDaysCount(Number(e.target.value))}
                      style={{
                        padding: '6px 8px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                        fontSize: 13,
                        backgroundColor: theme.bg,
                        color: theme.text,
                        minWidth: '80px'
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map(d => (
                        <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <h3
                    style={{ 
                      margin: 0, 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: theme.text, 
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {split.title}
                  </h3>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editingSplitId === split.id ? (
                  <>
                    <button
                      onClick={() => handleSaveSplit(split.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingSplitId(null);
                        setEditingSplitTitle('');
                        setEditingDaysCount(1);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: theme.textMuted,
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleStartEditSplit(split)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#0066FF',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${split.title}"? This will remove all days, lifts, and cardio sessions.`)) {
                      deleteSplit(split.id);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: theme.error,
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  Delete Split
                </button>
              </div>
            </div>

            {/* Split Content */}
            {expandedSplit === split.id && (
              <div style={{ marginTop: 16 }}>
                {/* Days List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {split.days && split.days.length > 0 ? (
                    split.days.map((day) => (
                    <div
                      key={day.id}
                      style={{
                        border: `1px solid ${expandedDay === day.id ? '#0066FF' : theme.border}`,
                        borderRadius: 6,
                        padding: 12,
                        backgroundColor: theme.bg,
                        transition: 'border-color 0.2s'
                      }}
                    >
                      {/* Day Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                          <button
                            onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'transparent',
                              color: theme.text,
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 12,
                              minWidth: '32px'
                            }}
                          >
                            {expandedDay === day.id ? '▼' : '▶'}
                          </button>
                          {editingDayKey === day.id ? (
                            <input
                              type="text"
                              value={editingDayName}
                              onChange={(e) => setEditingDayName(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                border: `1px solid ${theme.border}`,
                                borderRadius: 6,
                                fontSize: 13,
                                backgroundColor: theme.bg,
                                color: theme.text
                              }}
                            />
                          ) : (
                            <h4
                              style={{ 
                                margin: 0, 
                                fontSize: 14, 
                                fontWeight: 600, 
                                color: theme.text, 
                                cursor: 'default',
                                userSelect: 'none'
                              }}
                            >
                              {day.name}
                            </h4>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {editingDayKey === day.id ? (
                            <>
                              <button
                                onClick={() => handleSaveDay(split.id, day.id)}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#48bb78',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingDayKey(null);
                                  setEditingDayName('');
                                }}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: theme.textMuted,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.target.style.opacity = '1'}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartEditDay(day)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#0066FF',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 11,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Day Content */}
                      {expandedDay === day.id && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ padding: 12, backgroundColor: theme.bgSecondary, borderRadius: 6, marginBottom: 12, fontSize: 13, color: theme.text }}>
                            Day {day.id} expanded - {day.lifts?.length || 0} lifts, {day.cardio?.length || 0} cardio sessions
                          </div>
                          
                          {/* Lifts Section */}
                          <div style={{ marginBottom: 16 }}>
                            <h5 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600, color: theme.text }}>Lifts</h5>
                            
                            {/* Lifts List */}
                            {day.lifts?.length > 0 && (
                              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {day.lifts.map((lift) => (
                                  <div key={lift.id}>
                                    {editingLift?.id === lift.id ? (
                                      // Edit Mode
                                      <div style={{ 
                                        padding: 10, 
                                        backgroundColor: theme.bgSecondary, 
                                        borderRadius: 6,
                                        border: `1px solid ${theme.border}`
                                      }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          <div>
                                            <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>
                                              Exercise Name
                                            </label>
                                            <input
                                              type="text"
                                              value={editingLift.name}
                                              onChange={(e) => setEditingLift({ ...editingLift, name: e.target.value })}
                                              style={{
                                                width: '100%',
                                                padding: '6px 8px',
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: 4,
                                                fontSize: 13,
                                                backgroundColor: theme.bg,
                                                color: theme.text
                                              }}
                                            />
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                            <div>
                                              <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>
                                                Weight
                                              </label>
                                              <input
                                                type="text"
                                                value={editingLift.weight}
                                                onChange={(e) => setEditingLift({ ...editingLift, weight: e.target.value })}
                                                style={{
                                                  width: '100%',
                                                  padding: '6px 8px',
                                                  border: `1px solid ${theme.border}`,
                                                  borderRadius: 4,
                                                  fontSize: 13,
                                                  backgroundColor: theme.bg,
                                                  color: theme.text
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>
                                                Sets
                                              </label>
                                              <input
                                                type="number"
                                                value={editingLift.sets}
                                                onChange={(e) => setEditingLift({ ...editingLift, sets: e.target.value })}
                                                style={{
                                                  width: '100%',
                                                  padding: '6px 8px',
                                                  border: `1px solid ${theme.border}`,
                                                  borderRadius: 4,
                                                  fontSize: 13,
                                                  backgroundColor: theme.bg,
                                                  color: theme.text
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>
                                                Reps
                                              </label>
                                              <input
                                                type="number"
                                                value={editingLift.reps}
                                                onChange={(e) => setEditingLift({ ...editingLift, reps: e.target.value })}
                                                style={{
                                                  width: '100%',
                                                  padding: '6px 8px',
                                                  border: `1px solid ${theme.border}`,
                                                  borderRadius: 4,
                                                  fontSize: 13,
                                                  backgroundColor: theme.bg,
                                                  color: theme.text
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                            <button
                                              onClick={() => handleUpdateLift(split.id, day.id, lift.id)}
                                              style={{
                                                flex: 1,
                                                padding: '6px 12px',
                                                backgroundColor: '#48bb78',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                transition: 'background-color 0.2s'
                                              }}
                                              onMouseEnter={(e) => e.target.style.backgroundColor = '#38a169'}
                                              onMouseLeave={(e) => e.target.style.backgroundColor = '#48bb78'}
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => setEditingLift(null)}
                                              style={{
                                                flex: 1,
                                                padding: '6px 12px',
                                                backgroundColor: theme.textMuted,
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                transition: 'opacity 0.2s'
                                              }}
                                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      // View Mode
                                      <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '8px 10px',
                                        backgroundColor: theme.bgSecondary,
                                        borderRadius: 6,
                                        border: `1px solid ${theme.border}`
                                      }}>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 13, fontWeight: 500, color: theme.text, marginBottom: 4 }}>
                                            {lift.name}
                                          </div>
                                          <div style={{ fontSize: 11, color: theme.textMuted }}>
                                            <span style={{ fontWeight: 500 }}>Weight:</span> {lift.weight || 'N/A'} • <span style={{ fontWeight: 500 }}>Sets:</span> {lift.sets} × <span style={{ fontWeight: 500 }}>Reps:</span> {lift.reps}
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          <button
                                            onClick={() => setEditingLift({ ...lift })}
                                            style={{
                                              padding: '4px 10px',
                                              backgroundColor: '#0066FF',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: 4,
                                              cursor: 'pointer',
                                              fontSize: 11,
                                              transition: 'opacity 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteLift(split.id, day.id, lift.id)}
                                            style={{
                                              padding: '4px 10px',
                                              backgroundColor: theme.error,
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: 4,
                                              cursor: 'pointer',
                                              fontSize: 11,
                                              transition: 'opacity 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => setOpenLiftForm(openLiftForm === `${split.id}-${day.id}` ? null : `${split.id}-${day.id}`)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#48bb78',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#38a169'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#48bb78'}
                            >
                              {openLiftForm === `${split.id}-${day.id}` ? 'Cancel' : '+ Add Lift'}
                            </button>

                            {/* Add Lift Form */}
                            {openLiftForm === `${split.id}-${day.id}` && (
                            <form onSubmit={(e) => handleAddLift(split.id, day.id, e)}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div>
                                  <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>Exercise Name</label>
                                  <input
                                    type="text"
                                    value={getLiftFormValue(split.id, day.id, 'name', '')}
                                    onChange={(e) => setLiftFormValue(split.id, day.id, 'name', e.target.value)}
                                    placeholder="e.g., Bench Press"
                                    style={{
                                      width: '100%',
                                      padding: '4px 8px',
                                      border: `1px solid ${theme.border}`,
                                      borderRadius: 4,
                                      fontSize: 13,
                                      backgroundColor: theme.bg,
                                      color: theme.text,
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>Weight, Sets, Reps</label>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, width: '100%' }}>
                                    <input
                                      type="text"
                                      value={getLiftFormValue(split.id, day.id, 'weight', '')}
                                      onChange={(e) => setLiftFormValue(split.id, day.id, 'weight', e.target.value)}
                                      placeholder="185 lbs"
                                      style={{
                                        padding: '4px 6px',
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: theme.bg,
                                        color: theme.text
                                      }}
                                    />
                                    <input
                                      type="number"
                                      value={getLiftFormValue(split.id, day.id, 'sets', 3)}
                                      onChange={(e) => setLiftFormValue(split.id, day.id, 'sets', e.target.value)}
                                      placeholder="3"
                                      style={{
                                        padding: '4px 6px',
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: theme.bg,
                                        color: theme.text
                                      }}
                                    />
                                    <input
                                      type="number"
                                      value={getLiftFormValue(split.id, day.id, 'reps', 8)}
                                      onChange={(e) => setLiftFormValue(split.id, day.id, 'reps', e.target.value)}
                                      placeholder="8"
                                      style={{
                                        padding: '4px 6px',
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: theme.bg,
                                        color: theme.text
                                      }}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="submit"
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#48bb78',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#38a169'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#48bb78'}
                                >
                                  Add Lift
                                </button>
                              </div>
                            </form>
                            )}
                          </div>

                          {/* Cardio Section */}
                          <div>
                            <h5 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600, color: theme.text }}>Cardio</h5>
                            
                            {/* Cardio List */}
                            {day.cardio?.length > 0 && (
                              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {day.cardio.map((cardio) => (
                                  <div key={cardio.id}>
                                    {editingCardio?.id === cardio.id ? (
                                      // Edit Mode
                                      <div style={{ 
                                        padding: 10, 
                                        backgroundColor: theme.bgSecondary, 
                                        borderRadius: 6,
                                        border: `1px solid ${theme.border}`
                                      }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          <div>
                                            <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>
                                              Type
                                            </label>
                                            <select
                                              value={editingCardio.type}
                                              onChange={(e) => setEditingCardio({ ...editingCardio, type: e.target.value })}
                                              style={{
                                                width: '80%',
                                                padding: '6px 8px',
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: 4,
                                                fontSize: 13,
                                                backgroundColor: theme.bg,
                                                color: theme.text
                                              }}
                                            >
                                              {CARDIO_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                            <div>
                                              <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>
                                                Speed
                                              </label>
                                              <input
                                                type="number"
                                                step="0.1"
                                                value={editingCardio.speed}
                                                onChange={(e) => setEditingCardio({ ...editingCardio, speed: e.target.value })}
                                                style={{
                                                  width: '100%',
                                                  padding: '6px 8px',
                                                  border: `1px solid ${theme.border}`,
                                                  borderRadius: 4,
                                                  fontSize: 13,
                                                  backgroundColor: theme.bg,
                                                  color: theme.text
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>
                                                Incline
                                              </label>
                                              <input
                                                type="number"
                                                step="0.5"
                                                value={editingCardio.incline}
                                                onChange={(e) => setEditingCardio({ ...editingCardio, incline: e.target.value })}
                                                style={{
                                                  width: '100%',
                                                  padding: '6px 8px',
                                                  border: `1px solid ${theme.border}`,
                                                  borderRadius: 4,
                                                  fontSize: 13,
                                                  backgroundColor: theme.bg,
                                                  color: theme.text
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>
                                                Duration (min)
                                              </label>
                                              <input
                                                type="number"
                                                value={editingCardio.duration}
                                                onChange={(e) => setEditingCardio({ ...editingCardio, duration: e.target.value })}
                                                style={{
                                                  width: '100%',
                                                  padding: '6px 8px',
                                                  border: `1px solid ${theme.border}`,
                                                  borderRadius: 4,
                                                  fontSize: 13,
                                                  backgroundColor: theme.bg,
                                                  color: theme.text
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                            <button
                                              onClick={() => handleUpdateCardio(split.id, day.id, cardio.id)}
                                              style={{
                                                flex: 1,
                                                padding: '6px 12px',
                                                backgroundColor: '#48bb78',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                transition: 'background-color 0.2s'
                                              }}
                                              onMouseEnter={(e) => e.target.style.backgroundColor = '#38a169'}
                                              onMouseLeave={(e) => e.target.style.backgroundColor = '#48bb78'}
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => setEditingCardio(null)}
                                              style={{
                                                flex: 1,
                                                padding: '6px 12px',
                                                backgroundColor: theme.textMuted,
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                transition: 'opacity 0.2s'
                                              }}
                                              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                              onMouseLeave={(e) => e.target.style.opacity = '1'}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      // View Mode
                                      <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '8px 10px',
                                        backgroundColor: theme.bgSecondary,
                                        borderRadius: 6,
                                        border: `1px solid ${theme.border}`
                                      }}>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 13, fontWeight: 500, color: theme.text, marginBottom: 4 }}>
                                            {cardio.type}
                                          </div>
                                          <div style={{ fontSize: 11, color: theme.textMuted }}>
                                            <span style={{ fontWeight: 500 }}>Speed:</span> {cardio.speed} • <span style={{ fontWeight: 500 }}>Incline:</span> {cardio.incline}% • <span style={{ fontWeight: 500 }}>Duration:</span> {cardio.duration}m
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          <button
                                            onClick={() => setEditingCardio({ ...cardio })}
                                            style={{
                                              padding: '4px 10px',
                                              backgroundColor: '#0066FF',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: 4,
                                              cursor: 'pointer',
                                              fontSize: 11,
                                              transition: 'opacity 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCardio(split.id, day.id, cardio.id)}
                                            style={{
                                              padding: '4px 10px',
                                              backgroundColor: theme.error,
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: 4,
                                              cursor: 'pointer',
                                              fontSize: 11,
                                              transition: 'opacity 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => setOpenCardioForm(openCardioForm === `${split.id}-${day.id}` ? null : `${split.id}-${day.id}`)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#48bb78',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#38a169'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#48bb78'}
                            >
                              {openCardioForm === `${split.id}-${day.id}` ? 'Cancel' : '+ Add Cardio'}
                            </button>

                            {/* Add Cardio Form */}
                            {openCardioForm === `${split.id}-${day.id}` && (
                            <form onSubmit={(e) => handleAddCardio(split.id, day.id, e)}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div>
                                  <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>Type</label>
                                  <select
                                    value={getCardioFormValue(split.id, day.id, 'type', 'Treadmill')}
                                    onChange={(e) => setCardioFormValue(split.id, day.id, 'type', e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '4px 8px',
                                      border: `1px solid ${theme.border}`,
                                      borderRadius: 4,
                                      fontSize: 13,
                                      backgroundColor: theme.bg,
                                      color: theme.text,
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    {CARDIO_TYPES.map(type => (
                                      <option key={type} value={type}>{type}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>Speed, Incline, Duration</label>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, width: '100%' }}>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={getCardioFormValue(split.id, day.id, 'speed', 6)}
                                      onChange={(e) => setCardioFormValue(split.id, day.id, 'speed', e.target.value)}
                                      placeholder="6.0"
                                      style={{
                                        padding: '4px 6px',
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: theme.bg,
                                        color: theme.text
                                      }}
                                    />
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={getCardioFormValue(split.id, day.id, 'incline', 0)}
                                      onChange={(e) => setCardioFormValue(split.id, day.id, 'incline', e.target.value)}
                                      placeholder="0"
                                      style={{
                                        padding: '4px 6px',
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: theme.bg,
                                        color: theme.text
                                      }}
                                    />
                                    <input
                                      type="number"
                                      value={getCardioFormValue(split.id, day.id, 'duration', 20)}
                                      onChange={(e) => setCardioFormValue(split.id, day.id, 'duration', e.target.value)}
                                      placeholder="20"
                                      style={{
                                        padding: '4px 6px',
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: theme.bg,
                                        color: theme.text
                                      }}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="submit"
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#48bb78',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#38a169'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#48bb78'}
                                >
                                  Add Cardio
                                </button>
                              </div>
                            </form>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    ))
                  ) : (
                    <div style={{ padding: 16, backgroundColor: theme.bg, color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>
                      No days available in this split
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
