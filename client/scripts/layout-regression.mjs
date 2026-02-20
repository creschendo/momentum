import assert from 'node:assert/strict';

const normalizeLayout = (value) => {
	if (!Array.isArray(value) || value.length === 0) {
		return ['nutrition', 'productivity', 'fitness', null];
	}

	const next = [...value];
	if (next.length < 4) {
		while (next.length < 4) next.push(null);
	}
	if (next.length % 2 !== 0) {
		next.push(null);
	}

	return next;
};

const isCoveredSlot = (slots, spans, index) => {
	if (index % 2 === 0) return false;
	const leftModule = slots[index - 1];
	return !!leftModule && spans[leftModule] === 2;
};

const isAvailableSlot = (slots, spans, index) => slots[index] === null && !isCoveredSlot(slots, spans, index);

const compactLayoutState = (slots, spans) => {
	const normalized = normalizeLayout(slots);
	const modulesInOrder = [];

	for (let i = 0; i < normalized.length; i += 1) {
		if (isCoveredSlot(normalized, spans, i)) continue;
		const moduleKey = normalized[i];
		if (moduleKey) modulesInOrder.push(moduleKey);
	}

	const presentModuleKeys = new Set(modulesInOrder);
	const sanitizedSpans = Object.fromEntries(
		Object.entries(spans).filter(([key, value]) => presentModuleKeys.has(key) && value === 2)
	);

	let compacted = Array.from({ length: Math.max(4, normalized.length) }, () => null);

	const findFirstFitIndex = (span) => {
		if (span === 2) {
			for (let i = 0; i < compacted.length; i += 2) {
				if (compacted[i] === null && compacted[i + 1] === null) {
					return i;
				}
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

	return {
		layout: normalizeLayout(compacted),
		spans: sanitizedSpans
	};
};

const applyLayoutState = (nextLayout, nextSpans) => compactLayoutState(nextLayout, nextSpans);

const insertModuleAtIndex = (slots, moduleKey, insertIndex) => {
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

const stretchAtIndex = (layout, moduleSpans, index) => {
	const moduleKey = layout[index];
	if (!moduleKey) return { layout, spans: moduleSpans };

	let newLayout = normalizeLayout(layout);
	const rowStart = index % 2 === 0 ? index : index - 1;
	const rowEnd = rowStart + 1;
	const displacedModules = [];

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

	const nextSpans = { [moduleKey]: 2 };
	return applyLayoutState(newLayout, nextSpans);
};

const removeAtIndex = (layout, moduleSpans, index) => {
	if (isCoveredSlot(layout, moduleSpans, index)) return { layout, spans: moduleSpans };

	const next = [...layout];
	const moduleKey = next[index];
	next[index] = null;

	const nextSpans = { ...moduleSpans };
	if (moduleKey && nextSpans[moduleKey] === 2) {
		delete nextSpans[moduleKey];
	}

	return applyLayoutState(next, nextSpans);
};

const moduleCount = (layout) => layout.filter(Boolean).length;

const testExpansionShiftsDownWithoutDropping = () => {
	const layout = ['nutrition', 'productivity', 'fitness', null];
	const spans = {};

	const beforeCount = moduleCount(layout);
	const expanded = stretchAtIndex(layout, spans, 1);

	assert.equal(moduleCount(expanded.layout), beforeCount, 'expansion must not remove modules');
	assert.equal(expanded.layout[0], 'productivity', 'expanded module should anchor on left slot');
	assert.equal(expanded.layout[2], 'nutrition', 'displaced module should shift into next row');
	assert.equal(expanded.layout[3], 'fitness', 'other modules should shift down, not disappear');
	assert.equal(expanded.spans.productivity, 2, 'expanded module should be marked as spanning');
};

const testRemoveOneCollapsedOnlyRemovesOne = () => {
	const layout = ['nutrition', 'productivity', 'fitness', null];
	const expanded = stretchAtIndex(layout, {}, 0);

	const beforeCount = moduleCount(expanded.layout);
	const removed = removeAtIndex(expanded.layout, expanded.spans, 2);

	assert.equal(beforeCount - moduleCount(removed.layout), 1, 'remove should only remove one module');
};

const testNoModulesPlacedIntoCoveredSlot = () => {
	const state = applyLayoutState(['nutrition', 'productivity', 'fitness', null], { nutrition: 2 });
	for (let i = 0; i < state.layout.length; i += 1) {
		if (isCoveredSlot(state.layout, state.spans, i)) {
			assert.equal(state.layout[i], null, 'covered slots must remain empty');
		}
	}
};

const run = () => {
	testExpansionShiftsDownWithoutDropping();
	testRemoveOneCollapsedOnlyRemovesOne();
	testNoModulesPlacedIntoCoveredSlot();
	console.log('layout regression checks passed');
};

run();
