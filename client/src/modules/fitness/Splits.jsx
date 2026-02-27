import React, { useEffect, useRef, useState } from 'react';
import useSplits from './hooks/useSplits';
import { useTheme } from '../../context/ThemeContext';

const CARDIO_TYPES = ['Treadmill', 'Bike', 'Stairmaster', 'Rowing Machine', 'Elliptical'];

export default function Splits() {
  // Main workout planner state and CRUD actions come from the split hook.
  const { splits, loading, error, createSplit, updateSplit, deleteSplit, addDay, updateDay, deleteDay, addLift, updateLift, deleteLift, addCardio, updateCardio, deleteCardio } = useSplits();
  const { theme, currentTheme } = useTheme();
  const hoverTint = currentTheme === 'cove' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(62, 207, 142, 0.08)';
  const hoverGlow = currentTheme === 'cove' ? '0 0 0 2px rgba(255, 255, 255, 0.45)' : '0 0 0 2px rgba(62, 207, 142, 0.35)';
  const hoverAccent = theme.primaryDark;
  const splitDayHoverAccent = currentTheme === 'night' || currentTheme === 'cove' ? '#ffffff' : hoverAccent;
  const splitDayHoverGlow = currentTheme === 'night' ? '0 0 0 2px rgba(255, 255, 255, 0.45)' : hoverGlow;
  const addButtonHoverTint = 'rgba(255, 255, 255, 0.08)';
  const addButtonHoverAccent = '#ffffff';
  const addButtonHoverGlow = '0 0 0 2px rgba(255, 255, 255, 0.45)';

  const [expandedSplit, setExpandedSplit] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  
  // Lift forms state
  const [liftForms, setLiftForms] = useState({});
  const [liftWeightErrors, setLiftWeightErrors] = useState({});
  
  // Cardio forms state
  const [cardioForms, setCardioForms] = useState({});

  // Single operation state - ensures only one operation at a time
  const [activeOperation, setActiveOperation] = useState(null);
  
  // Drag state for reordering days
  const [draggedDay, setDraggedDay] = useState(null);
  const [dragOverSplitId, setDragOverSplitId] = useState(null);
  const [reorderedDays, setReorderedDays] = useState({}); // Track day reordering per split
  
  // Edit mode state
  const [editingLift, setEditingLift] = useState(null);
  const [editingCardio, setEditingCardio] = useState(null);
  const [editingSplitId, setEditingSplitId] = useState(null);
  const [editingSplitTitle, setEditingSplitTitle] = useState('');
  const [deleteConfirmSplitId, setDeleteConfirmSplitId] = useState(null);
  const [deleteConfirmDayKey, setDeleteConfirmDayKey] = useState(null);
  const [editingDayKey, setEditingDayKey] = useState(null);
  const [editingDayName, setEditingDayName] = useState('');
  const deleteConfirmRef = useRef(null);

  useEffect(() => {
    if (!deleteConfirmSplitId) return;

    const handleDocumentMouseDown = (event) => {
      if (deleteConfirmRef.current && !deleteConfirmRef.current.contains(event.target)) {
        setDeleteConfirmSplitId(null);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [deleteConfirmSplitId]);

  const handleCreateSplit = async () => {
    const splitNumber = splits.length + 1;
    const splitName = `new split ${splitNumber}`;
    try {
      await createSplit(splitName, 0);
    } catch (err) {
      console.error('Failed to create split:', err);
    }
  };

  const handleDeleteDay = async (splitId, dayId) => {
    try {
      await deleteDay(splitId, dayId);
      setDeleteConfirmDayKey(null);
      setReorderedDays((prev) => {
        const next = { ...prev };
        delete next[splitId];
        return next;
      });
      if (expandedDay === dayId) {
        setExpandedDay(null);
      }
    } catch (err) {
      console.error('Failed to delete day:', err);
    }
  };

  const handleAddDayToSplit = async (split) => {
    try {
      const nextDayNumber = (split.days?.length || 0) + 1;
      await addDay(split.id, `Day ${nextDayNumber}`);
      setReorderedDays((prev) => {
        const next = { ...prev };
        delete next[split.id];
        return next;
      });
      setExpandedSplit(split.id);
    } catch (err) {
      console.error('Failed to add day:', err);
    }
  };

  const handleStartEditSplit = (split) => {
    setEditingSplitId(split.id);
    setEditingSplitTitle(split.title || '');
  };

  const handleSaveSplit = async (splitId) => {
    if (!editingSplitTitle.trim()) return;
    try {
      await updateSplit(splitId, { title: editingSplitTitle.trim() });
      setEditingSplitId(null);
      setEditingSplitTitle('');
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
    if (!String(form?.weight ?? '').trim()) {
      setLiftWeightErrors((prev) => ({ ...prev, [formKey]: true }));
      return;
    }

    try {
      await addLift(splitId, dayId, {
        exerciseName: form.name,
        weight: form.weight || '',
        sets: parseInt(form.sets) || 3,
        reps: parseInt(form.reps) || 8
      });
      setLiftForms({ ...liftForms, [formKey]: { name: '', weight: '', sets: 3, reps: 8 } });
      setLiftWeightErrors((prev) => ({ ...prev, [formKey]: false }));
      setActiveOperation(null);
    } catch (err) {
      console.error('Failed to add lift:', err);
    }
  };

  const handleUpdateLift = async (splitId, dayId, liftId) => {
    if (!editingLift) return;
    try {
      await updateLift(splitId, dayId, liftId, {
        exerciseName: editingLift.exerciseName,
        sets: editingLift.sets,
        reps: editingLift.reps,
        weight: editingLift.weight
      });
      setActiveOperation(null);
      setEditingLift(null);
    } catch (err) {
      console.error('Failed to update lift:', err);
    }
  };

  const handleDeleteLift = async (splitId, dayId, liftId) => {
    try {
      await deleteLift(splitId, dayId, liftId);
      setActiveOperation(null);
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
        exerciseName: form?.exerciseName || 'Treadmill',
        durationMinutes: parseInt(form?.durationMinutes) || 20,
        intensity: form?.intensity || 'moderate'
      });
      setCardioForms({ ...cardioForms, [formKey]: { exerciseName: 'Treadmill', durationMinutes: 20, intensity: 'moderate' } });
      setActiveOperation(null);
    } catch (err) {
      console.error('Failed to add cardio:', err);
    }
  };

  const handleUpdateCardio = async (splitId, dayId, cardioId) => {
    if (!editingCardio) return;
    try {
      await updateCardio(splitId, dayId, cardioId, {
        exerciseName: editingCardio.exerciseName,
        durationMinutes: editingCardio.durationMinutes,
        intensity: editingCardio.intensity
      });
      setActiveOperation(null);
      setEditingCardio(null);
    } catch (err) {
      console.error('Failed to update cardio:', err);
    }
  };

  const handleDeleteCardio = async (splitId, dayId, cardioId) => {
    try {
      await deleteCardio(splitId, dayId, cardioId);
      setActiveOperation(null);
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

  // Drag and drop handlers keep day order local until a drop is finalized.
  const handleDragStart = (e, day, splitId) => {
    // Hide the default drag image
    const emptyImage = new Image();
    e.dataTransfer.setDragImage(emptyImage, 0, 0);
    
    setDraggedDay({ day, splitId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, splitId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSplitId !== splitId) {
      setDragOverSplitId(splitId);
    }
  };

  const handleDragEnd = () => {
    setDraggedDay(null);
    setDragOverSplitId(null);
  };

  const handleDrop = (e, targetDay, splitId) => {
    e.preventDefault();
    if (!draggedDay || draggedDay.splitId !== splitId) return;

    const draggedDayId = draggedDay.day.id;
    const targetDayId = targetDay.id;

    if (draggedDayId === targetDayId) {
      setDraggedDay(null);
      setDragOverSplitId(null);
      return;
    }

    // Get the current days for this split (either reordered or from splits)
    const currentSplit = splits.find((s) => s.id === splitId);
    const currentDays = reorderedDays[splitId] || currentSplit?.days || [];

    const days = [...currentDays];
    const draggedIndex = days.findIndex((d) => d.id === draggedDayId);
    const targetIndex = days.findIndex((d) => d.id === targetDayId);

    // Remove dragged day and insert at target position
    const [draggedDayObj] = days.splice(draggedIndex, 1);
    days.splice(targetIndex, 0, draggedDayObj);

    // Store the reordered days
    setReorderedDays({ ...reorderedDays, [splitId]: days });

    setDraggedDay(null);
    setDragOverSplitId(null);
  };

  const handleSplitHeaderClick = (event, splitId) => {
    if (event.target.closest('button, input, textarea, select, label')) return;
    setExpandedSplit(expandedSplit === splitId ? null : splitId);
  };

  const handleDayHeaderClick = (event, dayId) => {
    if (event.target.closest('button, input, textarea, select, label')) return;
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  if (loading) return <div style={{ color: theme.textMuted }}>Loading splits...</div>;

  return (
    <div style={{ marginTop: 24, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, color: theme.text }}>Workout Splits</h3>
      
      {error && <div style={{ color: theme.error, marginBottom: 16 }}>{error}</div>}

      {/* Splits List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {splits.map((split) => (
          <div
            key={split.id}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = splitDayHoverAccent;
              e.currentTarget.style.boxShadow = splitDayHoverGlow;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = dragOverSplitId === split.id
                ? theme.primary
                : (expandedSplit === split.id ? splitDayHoverAccent : theme.border);
              e.currentTarget.style.boxShadow = 'none';
            }}
            style={{
              border: dragOverSplitId === split.id
                ? `2px dashed ${theme.primary}`
                : `1.5px solid ${expandedSplit === split.id ? splitDayHoverAccent : theme.border}`,
              borderRadius: 8,
              padding: 16,
              backgroundColor: theme.bgSecondary,
              boxShadow: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
          >
            {/* Split Header */}
            <div
              onClick={(event) => handleSplitHeaderClick(event, split.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', cursor: 'pointer' }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: `translateX(-50%) rotate(${expandedSplit === split.id ? '180deg' : '0deg'})`,
                  transition: 'transform 220ms ease',
                  color: theme.textMuted,
                  fontSize: 14,
                  lineHeight: 1,
                  pointerEvents: 'none'
                }}
              >
                ▾
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                {editingSplitId === split.id ? (
                  <div style={{ display: 'flex', gap: 8, flex: 1, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editingSplitTitle}
                      onChange={(e) => setEditingSplitTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
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
                    {split.name}
                  </h3>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
                {editingSplitId === split.id ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveSplit(split.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: theme.primary,
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSplitId(null);
                        setEditingSplitTitle('');
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditSplit(split);
                    }}
                    aria-label="Edit split"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme.primary,
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
                    <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>✎</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmSplitId(split.id);
                  }}
                  style={{
                    padding: '6px 8px',
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
                  aria-label="Delete split"
                >
                  🗑
                </button>

                {deleteConfirmSplitId === split.id && (
                  <div
                    ref={deleteConfirmRef}
                    style={{
                      position: 'absolute',
                      top: 36,
                      right: 0,
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      padding: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      zIndex: 2,
                      minWidth: 220
                    }}
                  >
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>
                      Delete split &quot;{split.name}&quot;?
                    </div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmSplitId(null);
                        }}
                        style={{
                          padding: '6px 8px',
                          backgroundColor: theme.bgTertiary,
                          color: theme.text,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSplit(split.id);
                          setDeleteConfirmSplitId(null);
                        }}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: theme.error,
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                        aria-label="Confirm delete split"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Split Content */}
            {expandedSplit === split.id && (
              <div className="tab-swap-fade" style={{ marginTop: 16 }}>
                {/* Days List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {split.days && split.days.length > 0 ? (
                    (reorderedDays[split.id] || split.days).map((day) => (
                    <div
                      key={day.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, day, split.id)}
                      onDragOver={(e) => handleDragOver(e, split.id)}
                      onDrop={(e) => handleDrop(e, day, split.id)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = splitDayHoverAccent;
                        e.currentTarget.style.boxShadow = splitDayHoverGlow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = expandedDay === day.id ? splitDayHoverAccent : theme.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      style={{
                        border: `1px solid ${expandedDay === day.id ? splitDayHoverAccent : theme.border}`,
                        borderRadius: 6,
                        padding: 12,
                        backgroundColor: theme.bg,
                        boxShadow: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s, opacity 0.15s',
                        opacity: draggedDay?.day.id === day.id ? 0.5 : 1
                      }}
                    >
                      {/* Day Header */}
                      <div
                        onClick={(event) => handleDayHeaderClick(event, day.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, position: 'relative', cursor: 'pointer' }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: '50%',
                            transform: `translateX(-50%) rotate(${expandedDay === day.id ? '180deg' : '0deg'})`,
                            transition: 'transform 220ms ease',
                            color: theme.textMuted,
                            fontSize: 12,
                            lineHeight: 1,
                            pointerEvents: 'none'
                          }}
                        >
                          ▾
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                          {editingDayKey === day.id ? (
                            <input
                              type="text"
                              value={editingDayName}
                              onChange={(e) => setEditingDayName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveDay(split.id, day.id);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: theme.primary,
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
                                onClick={(e) => {
                                  e.stopPropagation();
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
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditDay(day);
                                }}
                                aria-label="Edit day"
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: theme.primary,
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
                                <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>✎</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmDayKey(`${split.id}-${day.id}`);
                                }}
                                style={{
                                  padding: '4px 8px',
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
                                aria-label="Delete day"
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {deleteConfirmDayKey === `${split.id}-${day.id}` && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: 8,
                            borderRadius: 6,
                            border: `1px solid ${theme.border}`,
                            backgroundColor: theme.bgSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8
                          }}
                        >
                          <span style={{ fontSize: 12, color: theme.textSecondary }}>
                            Delete &quot;{day.name}&quot;?
                          </span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmDayKey(null);
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: theme.bgTertiary,
                                color: theme.text,
                                border: `1px solid ${theme.border}`,
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 11
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDay(split.id, day.id);
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: theme.error,
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 11
                              }}
                              aria-label="Confirm delete day"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Day Content */}
                      {expandedDay === day.id && (
                        <div className="tab-swap-fade" style={{ marginTop: 12 }}>
                          <div style={{ padding: 12, backgroundColor: theme.bgSecondary, borderRadius: 6, marginBottom: 12, fontSize: 13, color: theme.text }}>
                            <div style={{ marginBottom: 8 }}>
                              <strong>Lifts:</strong> {day.lifts?.length > 0 ? day.lifts.map(l => l.exerciseName).join(', ') : 'None'}
                            </div>
                            <div>
                              <strong>Cardio:</strong> {day.cardio?.length > 0 ? day.cardio.map(c => c.exerciseName).join(', ') : 'None'}
                            </div>
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
                                              value={editingLift.exerciseName || ''}
                                              onChange={(e) => setEditingLift({ ...editingLift, exerciseName: e.target.value })}
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
                                                className="no-spin"
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
                                                className="no-spin"
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
                                                backgroundColor: theme.primary,
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                transition: 'background-color 0.2s'
                                              }}
                                              onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryDark}
                                              onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => {
                                                setActiveOperation(null);
                                                setEditingLift(null);
                                              }}
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
                                            {lift.exerciseName}
                                          </div>
                                          <div style={{ fontSize: 11, color: theme.textMuted }}>
                                            <span style={{ fontWeight: 500 }}>Weight:</span> {lift.weight || 'N/A'} • <span style={{ fontWeight: 500 }}>Sets:</span> {lift.sets} × <span style={{ fontWeight: 500 }}>Reps:</span> {lift.reps}
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          <button
                                            onClick={() => {
                                              setActiveOperation(`edit-lift-${lift.id}`);
                                              setEditingLift({ ...lift });
                                            }}
                                            aria-label="Edit lift"
                                            style={{
                                              padding: '4px 10px',
                                              backgroundColor: theme.primary,
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
                                            <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>✎</span>
                                          </button>
                                          <button
                                            onClick={() => handleDeleteLift(split.id, day.id, lift.id)}
                                            style={{
                                              padding: '4px 8px',
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
                                            aria-label="Delete lift"
                                          >
                                            🗑
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => {
                                if (activeOperation === `add-lift-${split.id}-${day.id}`) {
                                  setActiveOperation(null);
                                  const formKey = `${split.id}-${day.id}`;
                                  setLiftForms({ ...liftForms, [formKey]: { name: '', weight: '', sets: 3, reps: 8 } });
                                } else {
                                  setActiveOperation(`add-lift-${split.id}-${day.id}`);
                                }
                              }}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: theme.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryDark}
                              onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
                            >
                              {activeOperation === `add-lift-${split.id}-${day.id}` ? 'Cancel' : '+ Add Lift'}
                            </button>

                            {/* Add Lift Form */}
                            {activeOperation === `add-lift-${split.id}-${day.id}` && (
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
                                      onFocus={() => {
                                        const formKey = `${split.id}-${day.id}`;
                                        setLiftWeightErrors((prev) => ({ ...prev, [formKey]: false }));
                                      }}
                                      placeholder={liftWeightErrors[`${split.id}-${day.id}`] ? 'Please enter weight' : '185 lbs'}
                                      style={{
                                        padding: '4px 6px',
                                        border: `1px solid ${liftWeightErrors[`${split.id}-${day.id}`] ? theme.error : theme.border}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: theme.bg,
                                        color: liftWeightErrors[`${split.id}-${day.id}`] ? theme.error : theme.text
                                      }}
                                    />
                                    <input
                                      className="no-spin"
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
                                      className="no-spin"
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
                                    backgroundColor: theme.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryDark}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
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
                                              value={editingCardio.exerciseName || ''}
                                              onChange={(e) => setEditingCardio({ ...editingCardio, exerciseName: e.target.value })}
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
                                                Duration (min)
                                              </label>
                                              <input
                                                className="no-spin"
                                                type="number"
                                                value={editingCardio.durationMinutes || ''}
                                                onChange={(e) => setEditingCardio({ ...editingCardio, durationMinutes: e.target.value })}
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
                                                Intensity
                                              </label>
                                              <input
                                                type="text"
                                                value={editingCardio.intensity || ''}
                                                onChange={(e) => setEditingCardio({ ...editingCardio, intensity: e.target.value })}
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
                                                backgroundColor: theme.primary,
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                transition: 'background-color 0.2s'
                                              }}
                                              onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryDark}
                                              onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => {
                                                setActiveOperation(null);
                                                setEditingCardio(null);
                                              }}
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
                                            {cardio.exerciseName || 'Cardio'}
                                          </div>
                                          <div style={{ fontSize: 11, color: theme.textMuted }}>
                                            <span style={{ fontWeight: 500 }}>Duration:</span> {cardio.durationMinutes}m • <span style={{ fontWeight: 500 }}>Intensity:</span> {cardio.intensity || 'N/A'}
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          <button
                                            onClick={() => { setActiveOperation(`edit-cardio-${cardio.id}`); setEditingCardio({ ...cardio }); }}
                                            aria-label="Edit cardio"
                                            style={{
                                              padding: '4px 10px',
                                              backgroundColor: theme.primary,
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
                                            <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>✎</span>
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCardio(split.id, day.id, cardio.id)}
                                            style={{
                                              padding: '4px 8px',
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
                                            aria-label="Delete cardio"
                                          >
                                            🗑
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => {
                                if (activeOperation === `add-cardio-${split.id}-${day.id}`) {
                                  setActiveOperation(null);
                                  const formKey = `${split.id}-${day.id}`;
                                  setCardioForms({ ...cardioForms, [formKey]: { exerciseName: 'Treadmill', durationMinutes: 20, intensity: 'moderate' } });
                                } else {
                                  setActiveOperation(`add-cardio-${split.id}-${day.id}`);
                                }
                              }}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: theme.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryDark}
                              onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
                            >
                              {activeOperation === `add-cardio-${split.id}-${day.id}` ? 'Cancel' : '+ Add Cardio'}
                            </button>

                            {/* Add Cardio Form */}
                            {activeOperation === `add-cardio-${split.id}-${day.id}` && (
                            <form onSubmit={(e) => handleAddCardio(split.id, day.id, e)}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div>
                                  <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>Type</label>
                                  <select
                                    value={getCardioFormValue(split.id, day.id, 'exerciseName', 'Treadmill')}
                                    onChange={(e) => setCardioFormValue(split.id, day.id, 'exerciseName', e.target.value)}
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
                                  <label style={{ fontSize: 11, color: theme.textMuted, display: 'block', marginBottom: 4 }}>Duration (min), Intensity</label>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: '100%' }}>
                                    <input
                                      className="no-spin"
                                      type="number"
                                      value={getCardioFormValue(split.id, day.id, 'durationMinutes', 20)}
                                      onChange={(e) => setCardioFormValue(split.id, day.id, 'durationMinutes', e.target.value)}
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
                                    <input
                                      type="text"
                                      value={getCardioFormValue(split.id, day.id, 'intensity', 'moderate')}
                                      onChange={(e) => setCardioFormValue(split.id, day.id, 'intensity', e.target.value)}
                                      placeholder="moderate"
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
                                    backgroundColor: theme.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryDark}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
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

                  <button
                    type="button"
                    onClick={() => handleAddDayToSplit(split)}
                    style={{
                      width: '100%',
                      height: 46,
                      backgroundColor: theme.bgTertiary,
                      color: theme.textMuted,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 28,
                      lineHeight: 1,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'none',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = addButtonHoverTint;
                      e.currentTarget.style.borderColor = addButtonHoverAccent;
                      e.currentTarget.style.boxShadow = addButtonHoverGlow;
                      e.currentTarget.style.color = theme.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.bgTertiary;
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.color = theme.textMuted;
                    }}
                    aria-label={`Add day to ${split.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCreateSplit}
        style={{
          width: '100%',
          height: 40,
          marginTop: 18,
          marginBottom: 18,
          backgroundColor: theme.bgTertiary,
          color: theme.textMuted,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          cursor: 'pointer',
          fontSize: 34,
          lineHeight: 1,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
          transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = addButtonHoverTint;
          e.currentTarget.style.borderColor = addButtonHoverAccent;
          e.currentTarget.style.boxShadow = addButtonHoverGlow;
          e.currentTarget.style.color = theme.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.bgTertiary;
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.color = theme.textMuted;
        }}
        aria-label="Create new split"
      >
        +
      </button>
    </div>
  );
}
