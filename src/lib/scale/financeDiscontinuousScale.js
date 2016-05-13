"use strict";

import d3 from "d3";

import { isDefined, isNotDefined, head, last, slidingWindow } from "../utils";

var tickLevels = [
	{ target: 50e3, level: 1 },
	{ target: 10e4, level: 2 },
	{ target: 28e4, level: 3 },
	{ target: 55e4, level: 4 },
	{ target: 11e5, level: 5 },
	{ target: 21e5, level: 6 },
	{ target: 43e5, level: 7 },
	{ target: 49e5, level: 8 }, // not tested
	{ target: 50e5, level: 9 }, // not tested
	{ target: 58e6, level: 10 }, // not tested
	{ target: 58e6, level: 11 },
	{ target: 11e7, level: 12 },
	{ target: 78e7, level: 13 },
	{ target: 16e8, level: 14 },
	{ target: 62e8, level: 15 },
	{ target: 90e8, level: 16 },
	{ target: 10e20, level: 17 },
];

var tickLevelBisector = d3.bisector(function(d) { return d.target; }).left;

export default function financeDiscontinuousScale(index,
		interval,
		backingLinearScale = d3.scale.linear()) {

	if (isNotDefined(index) || isNotDefined(interval))
		throw new Error("Use the discontinuousTimeScaleProvider to create financeDiscontinuousScale");

	function scale(x) {
		return backingLinearScale(x);
	}
	scale.invert = function(x) {
		return backingLinearScale.invert(Math.round(x * 1e5 / 1e5));
	};
	scale.domain = function(x) {
		if (!arguments.length) return backingLinearScale.domain();
		backingLinearScale.domain(x);
		return scale;
	};
	scale.range = function(x) {
		if (!arguments.length) return backingLinearScale.range();
		backingLinearScale.range(x);
		return scale;
	};
	scale.rangeRound = function(x) {
		return backingLinearScale.range(x);
	};
	scale.clamp = function(x) {
		if (!arguments.length) return backingLinearScale.clamp();
		backingLinearScale.clamp(x);
		return scale;
	};
	scale.interpolate = function(x) {
		if (!arguments.length) return backingLinearScale.interpolate();
		backingLinearScale.interpolate(x);
		return scale;
	};
	scale.ticks = function(m) {

		var [domainStart, domainEnd] = backingLinearScale.domain();
		var start = Math.max(Math.ceil(domainStart), 0);
		var end = Math.min(Math.floor(domainEnd), index.length - 1);

		var newM = ((end - start) / (domainEnd - domainStart)) * m;
		var target = Math.round((end - start + 1) * interval / newM);

		// var subList = index.slice(start, end + 1);
		var { level } = tickLevels[tickLevelBisector(tickLevels, target)];

		// console.log(target, level);

		var backingTicks = backingLinearScale.ticks(m);
		var distance = backingTicks.length > 0
			? (last(backingTicks) - head(backingTicks)) / (backingTicks.length - 1) / 4
			: 1;

		var ticks = []
		for (var i = start; i < end + 1; i++) {
			if (index[i].level >= level) ticks.push(index[i].index);
		};

		// subList.filter(each => each.level >= level).map(d => d.index);

		var ticksSet = d3.set(ticks);

		for (var i = 0; i < ticks.length - 1; i++) {
			for (var j = i + 1; j < ticks.length; j++) {
				if (ticks[j] - ticks[i] < distance) {
					ticksSet.remove(index[ticks[i]].level >= index[ticks[j]].level ? ticks[j] : ticks[i])
				}
			}
		}

		return ticksSet.values().map(d => parseInt(d, 10));
	};
	scale.tickFormat = function(m) {
		return function(x) {
			var { format, date } = index[x];
			return format(date);
		};
	};
	scale.nice = function(m) {
		backingLinearScale.nice(m);
		return scale;
	};
	scale.copy = function() {
		return financeDiscontinuousScale(index, interval, backingLinearScale.copy());
	};
	return scale;
}