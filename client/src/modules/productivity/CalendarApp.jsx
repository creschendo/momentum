import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const VIEW_OPTIONS = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' }
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const start = startOfDay(date);
  const day = start.getDay();
  return addDays(start, -day);
}

function startOfMonth(date) {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
}

function formatTimeLabelFromInput(timeValue) {
  const [hourText, minuteText] = timeValue.split(':');
  const hours = Number(hourText);
  const minutes = Number(minuteText || '0');

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function ViewButton({ active, onClick, label, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: 6,
        border: `1px solid ${active ? theme.primary : theme.border}`,
        backgroundColor: active ? theme.primary : theme.bg,
        color: active ? theme.bg : theme.text,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );
}

export default function CalendarApp() {
  const { theme } = useTheme();
  const containerRef = useRef(null);

  const [view, setView] = useState('week');
  const [anchorDate, setAnchorDate] = useState(startOfDay(new Date()));

  const [events, setEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDateKey, setNewEventDateKey] = useState(() => formatDateKey(startOfDay(new Date())));
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [eventError, setEventError] = useState('');

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState(null);
  const [editingEventForm, setEditingEventForm] = useState({ title: '', dateKey: '', time: '09:00', description: '' });

  const clearEventActions = () => {
    setSelectedEventId(null);
    setEditingEventId(null);
    setDeleteConfirmEventId(null);
  };

  useEffect(() => {
    const onMouseDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        clearEventActions();
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const getEventsForDate = (date) => {
    const dateKey = formatDateKey(date);
    return events
      .filter((event) => event.dateKey === dateKey)
      .sort((first, second) => {
        if (first.hour === second.hour) {
          return (first.minute || 0) - (second.minute || 0);
        }
        return first.hour - second.hour;
      });
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [anchorDate]);

  const monthCells = useMemo(() => {
    const firstDay = startOfMonth(anchorDate);
    const gridStart = addDays(firstDay, -firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [anchorDate]);

  const handlePrevious = () => {
    if (view === 'day') {
      setAnchorDate((prev) => addDays(prev, -1));
      return;
    }
    if (view === 'week') {
      setAnchorDate((prev) => addDays(prev, -7));
      return;
    }
    setAnchorDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return startOfDay(next);
    });
  };

  const handleNext = () => {
    if (view === 'day') {
      setAnchorDate((prev) => addDays(prev, 1));
      return;
    }
    if (view === 'week') {
      setAnchorDate((prev) => addDays(prev, 7));
      return;
    }
    setAnchorDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return startOfDay(next);
    });
  };

  const handleAddEvent = (e) => {
    e.preventDefault();

    if (!newEventTitle.trim()) {
      setEventError('Event title is required.');
      return;
    }

    if (!newEventDateKey) {
      setEventError('Event date is required.');
      return;
    }

    const [hourText, minuteText] = newEventTime.split(':');
    const eventHour = Number(hourText);
    const eventMinute = Number(minuteText || '0');

    if (!Number.isInteger(eventHour) || eventHour < 0 || eventHour > 23) {
      setEventError('Event time is invalid.');
      return;
    }

    const createdEvent = {
      id: `evt-${Date.now()}`,
      title: newEventTitle.trim(),
      dateKey: newEventDateKey,
      hour: eventHour,
      minute: eventMinute,
      timeLabel: formatTimeLabelFromInput(newEventTime),
      description: ''
    };

    setEvents((prev) => [...prev, createdEvent]);
    setNewEventTitle('');
    setEventError('');
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setEditingEventId(null);
    setDeleteConfirmEventId(null);
  };

  const handleStartEditEvent = (eventItem) => {
    const time = `${String(eventItem.hour).padStart(2, '0')}:${String(eventItem.minute || 0).padStart(2, '0')}`;
    setEditingEventId(eventItem.id);
    setDeleteConfirmEventId(null);
    setEditingEventForm({
      title: eventItem.title,
      dateKey: eventItem.dateKey,
      time,
      description: eventItem.description || ''
    });
  };

  const handleSaveEditedEvent = (eventId) => {
    if (!editingEventForm.title.trim() || !editingEventForm.dateKey || !editingEventForm.time) return;

    const [hourText, minuteText] = editingEventForm.time.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText || '0');

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return;

    setEvents((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? {
              ...item,
              title: editingEventForm.title.trim(),
              dateKey: editingEventForm.dateKey,
              hour,
              minute,
              timeLabel: formatTimeLabelFromInput(editingEventForm.time),
              description: editingEventForm.description.trim()
            }
          : item
      )
    );

    setEditingEventId(null);
    setDeleteConfirmEventId(null);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents((prev) => prev.filter((item) => item.id !== eventId));
    setSelectedEventId(null);
    setEditingEventId(null);
    setDeleteConfirmEventId(null);
  };

  const renderEventActionPopover = (eventItem, compact = false) => {
    if (selectedEventId !== eventItem.id) return null;
    const isEditing = editingEventId === eventItem.id;

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: compact ? 'auto' : 0,
          right: compact ? 0 : 'auto',
          zIndex: 20,
          minWidth: isEditing ? (compact ? 210 : 250) : 'auto',
          width: isEditing ? 'auto' : 'fit-content',
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 8,
          boxShadow: '0 10px 24px rgba(0,0,0,0.2)'
        }}
      >
        {isEditing ? (
          <div style={{ display: 'grid', gap: 6 }}>
            <input
              type="text"
              value={editingEventForm.title}
              onChange={(e) => setEditingEventForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bgSecondary,
                color: theme.text,
                fontSize: 12,
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 6 }}>
              <input
                type="date"
                value={editingEventForm.dateKey}
                onChange={(e) => setEditingEventForm((prev) => ({ ...prev, dateKey: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bgSecondary,
                  color: theme.text,
                  fontSize: 12,
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="time"
                value={editingEventForm.time}
                onChange={(e) => setEditingEventForm((prev) => ({ ...prev, time: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bgSecondary,
                  color: theme.text,
                  fontSize: 12,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <textarea
              value={editingEventForm.description}
              onChange={(e) => setEditingEventForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              rows={3}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bgSecondary,
                color: theme.text,
                fontSize: 12,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button
                type="button"
                onClick={() => setEditingEventId(null)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bgSecondary,
                  color: theme.text,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedEvent(eventItem.id)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: theme.primary,
                  color: theme.bg,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button
                type="button"
                onClick={() => handleStartEditEvent(eventItem)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bgSecondary,
                  color: theme.text,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmEventId(eventItem.id)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: `1px solid ${theme.error}`,
                  backgroundColor: theme.errorBg,
                  color: theme.error,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
            {deleteConfirmEventId === eventItem.id && (
              <div
                style={{
                  paddingTop: 6,
                  alignSelf: 'flex-end',
                  width: 'fit-content'
                }}
              >
                <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>
                  Delete this event?
                </div>
                <div
                  style={{
                    height: 1,
                    width: 120,
                    backgroundColor: theme.border,
                    marginLeft: 'auto',
                    marginBottom: 6
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 6,
                    width: 'fit-content',
                    marginLeft: 'auto'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmEventId(null)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.bgSecondary,
                      color: theme.text,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(eventItem.id)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: theme.error,
                      color: 'white',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const headerLabel =
    view === 'day'
      ? formatDayLabel(anchorDate)
      : view === 'week'
        ? `${formatDayLabel(weekDays[0])} - ${formatDayLabel(weekDays[6])}`
        : formatMonthLabel(anchorDate);

  return (
    <div
      ref={containerRef}
      onClick={clearEventActions}
      style={{ marginTop: 24, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.text }}>Calendar</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VIEW_OPTIONS.map((option) => (
            <ViewButton
              key={option.key}
              active={view === option.key}
              onClick={() => setView(option.key)}
              label={option.label}
              theme={theme}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handlePrevious}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              backgroundColor: theme.bg,
              color: theme.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Prev
          </button>
          <button
            onClick={() => setAnchorDate(startOfDay(new Date()))}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              backgroundColor: theme.bg,
              color: theme.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Today
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              backgroundColor: theme.bg,
              color: theme.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Next
          </button>
        </div>
        <div style={{ color: theme.text, fontSize: 14, fontWeight: 600 }}>{headerLabel}</div>
      </div>

      <form
        onSubmit={handleAddEvent}
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 1fr) 150px 120px auto',
          gap: 8,
          alignItems: 'end'
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 600 }}>
            Event Title
          </label>
          <input
            type="text"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="Add event title"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bg,
              color: theme.text,
              fontSize: 13,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 600 }}>
            Date
          </label>
          <input
            type="date"
            value={newEventDateKey}
            onChange={(e) => setNewEventDateKey(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bg,
              color: theme.text,
              fontSize: 13,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: theme.textMuted, marginBottom: 4, fontWeight: 600 }}>
            Time
          </label>
          <input
            type="time"
            value={newEventTime}
            onChange={(e) => setNewEventTime(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bg,
              color: theme.text,
              fontSize: 13,
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: theme.primary,
            color: theme.bg,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            height: 36
          }}
        >
          Add Event
        </button>
      </form>
      {eventError && (
        <div style={{ marginTop: 8, color: theme.error, fontSize: 12 }}>{eventError}</div>
      )}

      <div style={{ marginTop: 16 }}>
        {view === 'day' && (
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {Array.from({ length: 12 }, (_, idx) => idx + 8).map((hour) => {
              const hourEvents = getEventsForDate(anchorDate).filter((event) => event.hour === hour);
              return (
                <div
                  key={hour}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr',
                    borderBottom: `1px solid ${theme.border}`,
                    minHeight: 52,
                    backgroundColor: theme.bg
                  }}
                >
                  <div style={{ padding: '10px 12px', color: theme.textMuted, fontSize: 12, fontWeight: 600 }}>
                    {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                  </div>
                  <div style={{ padding: '8px 10px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {hourEvents.length > 0 ? (
                      hourEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectEvent(event.id);
                          }}
                          style={{
                            position: 'relative',
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: `1px solid ${theme.borderLight}`,
                            backgroundColor: theme.bgSecondary,
                            color: theme.text,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          {event.timeLabel} · {event.title}
                          {renderEventActionPopover(event)}
                        </div>
                      ))
                    ) : (
                      <span style={{ color: theme.textMuted, fontSize: 12 }}>No events</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'week' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
              {weekDays.map((day) => {
                const dayEvents = getEventsForDate(day);
                return (
                  <div
                    key={formatDateKey(day)}
                    style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      backgroundColor: theme.bg,
                      padding: 8,
                      minHeight: 220
                    }}
                  >
                    <div style={{ color: theme.text, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                      {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {dayEvents.length > 0 ? (
                        dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEvent(event.id);
                            }}
                            style={{
                              position: 'relative',
                              padding: '6px 7px',
                              borderRadius: 6,
                              border: `1px solid ${theme.borderLight}`,
                              backgroundColor: theme.bgSecondary,
                              color: theme.text,
                              fontSize: 11,
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{event.title}</div>
                            <div style={{ color: theme.textMuted, marginTop: 2 }}>{event.timeLabel}</div>
                            {renderEventActionPopover(event, true)}
                          </div>
                        ))
                      ) : (
                        <span style={{ color: theme.textMuted, fontSize: 12 }}>No events</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'month' && (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 760 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginBottom: 6 }}>
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} style={{ padding: '6px 8px', color: theme.textMuted, fontSize: 12, fontWeight: 600 }}>
                    {label}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
                {monthCells.map((date) => {
                  const inCurrentMonth = date.getMonth() === anchorDate.getMonth();
                  const dateEvents = getEventsForDate(date);
                  return (
                    <div
                      key={formatDateKey(date)}
                      style={{
                        border: `1px solid ${theme.border}`,
                        borderRadius: 8,
                        minHeight: 108,
                        padding: 8,
                        backgroundColor: inCurrentMonth ? theme.bg : theme.bgSecondary
                      }}
                    >
                      <div style={{ fontSize: 12, color: inCurrentMonth ? theme.text : theme.textMuted, fontWeight: 600 }}>
                        {date.getDate()}
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {dateEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectEvent(event.id);
                            }}
                            style={{
                              position: 'relative',
                              padding: '4px 6px',
                              borderRadius: 4,
                              backgroundColor: theme.bgTertiary,
                              color: theme.text,
                              fontSize: 11,
                              border: `1px solid ${theme.borderLight}`,
                              cursor: 'pointer'
                            }}
                          >
                            {event.title}
                            {renderEventActionPopover(event, true)}
                          </div>
                        ))}
                        {dateEvents.length > 2 && (
                          <div style={{ fontSize: 11, color: theme.textMuted }}>+{dateEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
