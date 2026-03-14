import { useEffect, useMemo, useState } from 'react';
import { MODULES } from '../utils/moduleHelpers';

type Layout = (string | null)[];
type Spans = Record<string, number>;

export default function useLayout() {
  const DEFAULT_LAYOUT: Layout = ['nutrition', 'productivity', 'fitness', null];

  const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

  const normalizeLayout = (value: unknown): Layout => {
    if (!Array.isArray(value) || value.length === 0) {
      return [...DEFAULT_LAYOUT];
    }
    const next: Layout = value.map((item) => (typeof item === 'string' || item === null ? item : null));
    if (next.length < 4) {
      while (next.length < 4) next.push(null);
    }
    if (next.length % 2 !== 0) {
      next.push(null);
    }
    return next;
  };

  const [layout, setLayout] = useState<Layout>(() => {
    const saved = localStorage.getItem('module-layout');
    if (saved) {
      try {
        return normalizeLayout(JSON.parse(saved));
      } catch {
        return [...DEFAULT_LAYOUT];
      }
    }
    return [...DEFAULT_LAYOUT];
  });

  const [moduleSpans, setModuleSpans] = useState<Spans>(() => {
    const saved = localStorage.getItem('module-spans');
    if (!saved) return {};
    try {
      const parsed: unknown = JSON.parse(saved);
      if (!isPlainObject(parsed)) return {};
      return Object.fromEntries(
        Object.entries(parsed).filter(([key, value]) => typeof key === 'string' && value === 2)
      ) as Spans;
    } catch {
      return {};
    }
  });

  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<number | null>(null);
  const [removeConfirmIndex, setRemoveConfirmIndex] = useState<number | null>(null);
  const [addMenuIndex, setAddMenuIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('module-layout', JSON.stringify(layout));
  }, [layout]);

  useEffect(() => {
    localStorage.setItem('module-spans', JSON.stringify(moduleSpans));
  }, [moduleSpans]);

  const isCoveredSlot = (slots: Layout, spans: Spans, index: number): boolean => {
    if (index % 2 === 0) return false;
    const leftModule = slots[index - 1];
    return !!leftModule && spans[leftModule] === 2;
  };

  const isAvailableSlot = (slots: Layout, spans: Spans, index: number): boolean =>
    slots[index] === null && !isCoveredSlot(slots, spans, index);

  const compactLayoutState = (slots: Layout, spans: Spans): { layout: Layout; spans: Spans } => {
    const normalized = normalizeLayout(slots);
    const modulesInOrder: string[] = [];

    for (let i = 0; i < normalized.length; i += 1) {
      if (isCoveredSlot(normalized, spans, i)) continue;
      const moduleKey = normalized[i];
      if (moduleKey) modulesInOrder.push(moduleKey);
    }

    const presentModuleKeys = new Set(modulesInOrder);
    const sanitizedSpans: Spans = Object.fromEntries(
      Object.entries(spans).filter(([key, value]) => presentModuleKeys.has(key) && value === 2)
    );

    let compacted: Layout = Array.from({ length: Math.max(4, normalized.length) }, () => null);

    const findFirstFitIndex = (span: number): number => {
      if (span === 2) {
        for (let i = 0; i < compacted.length; i += 2) {
          if (compacted[i] === null && compacted[i + 1] === null) return i;
        }
        compacted = [...compacted, null, null];
        return compacted.length - 2;
      }

      for (let i = 0; i < compacted.length; i += 1) {
        if (isAvailableSlot(compacted, sanitizedSpans, i)) return i;
      }

      compacted = [...compacted, null, null];
      return compacted.length - 2;
    };

    modulesInOrder.forEach((moduleKey) => {
      const span = sanitizedSpans[moduleKey] === 2 ? 2 : 1;
      const targetIndex = findFirstFitIndex(span);
      compacted[targetIndex] = moduleKey;
    });

    while (compacted.length > 4) {
      const lastRow = compacted.slice(-2);
      if (lastRow[0] === null && lastRow[1] === null) {
        compacted = compacted.slice(0, -2);
      } else {
        break;
      }
    }

    return { layout: normalizeLayout(compacted), spans: sanitizedSpans };
  };

  const applyLayoutState = (nextLayout: Layout, nextSpans: Spans): void => {
    const compacted = compactLayoutState(nextLayout, nextSpans);
    setLayout(compacted.layout);
    setModuleSpans(compacted.spans);
  };

  const insertModuleAtIndex = (slots: Layout, moduleKey: string, insertIndex: number): Layout => {
    let next = [...slots];
    let emptyIndex = next.indexOf(null, insertIndex);

    while (emptyIndex === -1) {
      next = [...next, null, null];
      emptyIndex = next.length - 2;
    }

    for (let i = emptyIndex; i > insertIndex; i -= 1) {
      next[i] = next[i - 1];
    }

    next[insertIndex] = moduleKey;
    return next;
  };

  const handleDragStart = (e: React.DragEvent, moduleKey: string): void => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).draggable) return;
    setDraggedModule(moduleKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, quadrantIndex: number): void => {
    if (draggedModule === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverQuadrant(quadrantIndex);
  };

  const handleDragLeave = (): void => setDragOverQuadrant(null);

  const handleDrop = (e: React.DragEvent, targetQuadrantIndex: number): void => {
    e.preventDefault();
    if (draggedModule === null) return;
    if (isCoveredSlot(layout, moduleSpans, targetQuadrantIndex)) return;

    const sourceQuadrantIndex = layout.indexOf(draggedModule);
    if (sourceQuadrantIndex === -1) return;

    const newLayout = [...layout];
    const nextSpans = { ...moduleSpans };
    const targetModule = newLayout[targetQuadrantIndex];

    if (nextSpans[draggedModule] === 2) delete nextSpans[draggedModule];
    if (targetModule && nextSpans[targetModule] === 2) delete nextSpans[targetModule];

    newLayout[targetQuadrantIndex] = draggedModule;
    newLayout[sourceQuadrantIndex] = targetModule;

    applyLayoutState(newLayout, nextSpans);
    setDraggedModule(null);
    setDragOverQuadrant(null);
    setAddMenuIndex(null);
    setRemoveConfirmIndex(null);
  };

  const handleDragEnd = (): void => {
    setDraggedModule(null);
    setDragOverQuadrant(null);
  };

  const handleRemoveModule = (quadrantIndex: number): void => {
    if (isCoveredSlot(layout, moduleSpans, quadrantIndex)) return;

    const newLayout = [...layout];
    const moduleKey = newLayout[quadrantIndex];
    newLayout[quadrantIndex] = null;

    const nextSpans = { ...moduleSpans };
    if (moduleKey && nextSpans[moduleKey] === 2) delete nextSpans[moduleKey];

    applyLayoutState(newLayout, nextSpans);
    setRemoveConfirmIndex(null);
  };

  const handleAddModule = (quadrantIndex: number, moduleKey: string): void => {
    if (isCoveredSlot(layout, moduleSpans, quadrantIndex)) return;
    const newLayout = [...layout];
    newLayout[quadrantIndex] = moduleKey;
    applyLayoutState(newLayout, { ...moduleSpans });
    setAddMenuIndex(null);
  };

  const handleStretchModule = (index: number): void => {
    const moduleKey = layout[index];
    if (!moduleKey) return;

    let newLayout = normalizeLayout(layout);
    const rowStart = index % 2 === 0 ? index : index - 1;
    const rowEnd = rowStart + 1;
    const displacedModules: string[] = [];

    newLayout[index] = null;

    [rowStart, rowEnd].forEach((slotIndex) => {
      const occupyingModule = newLayout[slotIndex];
      if (occupyingModule && occupyingModule !== moduleKey) {
        displacedModules.push(occupyingModule);
      }
      newLayout[slotIndex] = null;
    });

    newLayout[rowStart] = moduleKey;

    displacedModules.forEach((displacedModule, offset) => {
      newLayout = insertModuleAtIndex(newLayout, displacedModule, rowEnd + 1 + offset);
    });

    applyLayoutState(newLayout, { [moduleKey]: 2 });
    setAddMenuIndex(null);
    setRemoveConfirmIndex(null);
  };

  const handleCollapseModule = (moduleKey: string): void => {
    if (!moduleSpans[moduleKey]) return;
    const nextSpans = { ...moduleSpans };
    delete nextSpans[moduleKey];
    applyLayoutState([...layout], nextSpans);
  };

  const handleToggleExpand = (index: number): void => {
    const moduleKey = layout[index];
    if (!moduleKey) return;
    if (moduleSpans[moduleKey] === 2) {
      handleCollapseModule(moduleKey);
      return;
    }
    handleStretchModule(index);
  };

  const allModuleKeys = useMemo(() => MODULES.map((m) => m.key), []);
  const remainingModules = allModuleKeys.filter((key) => !layout.includes(key));
  const moduleTitleByKey = MODULES.reduce<Record<string, string>>((acc, m) => {
    acc[m.key] = m.title;
    return acc;
  }, {});

  return {
    layout,
    moduleSpans,
    draggedModule,
    dragOverQuadrant,
    removeConfirmIndex,
    addMenuIndex,
    remainingModules,
    moduleTitleByKey,
    isCoveredSlot,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleRemoveModule,
    handleAddModule,
    handleToggleExpand,
    setRemoveConfirmIndex,
    setAddMenuIndex
  };
}
