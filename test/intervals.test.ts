import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -10, max: 10 }), fc.nat(5))
  .map(([s, len]) => [s, s + len] as Interval);
const intervalList = fc.array(interval, { maxLength: 8 });

const covers = (xs: readonly Interval[], p: number) => xs.some(([a, b]) => a <= p && p <= b);

const probes = Array.from({ length: 81 }, (_, i) => -20 + i / 2);


const disjointList = fc
  .tuple(
    fc.integer({ min: -10, max: 0 }),                                               // 从哪里开始
    fc.array(fc.tuple(fc.integer({ min: 1, max: 4 }), fc.nat(4)), { maxLength: 6 }), // 每段的（空隙, 长度）
  )
  .map(([begin, parts]) => {
    const sorted: Interval[] = [];
    let cur = begin;
    for (const [gap, len] of parts) { const s = cur + gap; sorted.push([s, s + len]); cur = s + len; }
    return sorted;
  })
  .chain(sorted => fc
    .shuffledSubarray(sorted, { minLength: sorted.length, maxLength: sorted.length })
    .map(shuffled => ({ sorted, shuffled })));


describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

    // Pattern: invariant. Output is sorted, valid, and consecutive intervals neither overlap nor touch.
  it('output is sorted with gaps between intervals', () => {
    fc.assert(fc.property(intervalList, xs => {
      const out = mergeIntervals(xs);
      for (const [a, b] of out) expect(a).toBeLessThanOrEqual(b);
      for (let i = 0; i + 1 < out.length; i++) expect(out[i][1]).toBeLessThan(out[i + 1][0]);
    }));
  });

    // Pattern: differential. A point is covered by the output exactly when it is covered by the input.
  it('covers exactly the same points as the input', () => {
    fc.assert(fc.property(intervalList, xs => {
      const out = mergeIntervals(xs);
      for (const p of probes) expect(covers(out, p)).toBe(covers(xs, p));
    }));
  });

    // Pattern: metamorphic. Shuffling or duplicating the input does not change the output.
  it('order and duplicates do not matter', () => {
    const arb = intervalList.chain(xs => fc.tuple(fc.constant(xs),
      fc.shuffledSubarray([...xs, ...xs], { minLength: 2 * xs.length, maxLength: 2 * xs.length })));
    fc.assert(fc.property(arb, ([xs, ys]) => {
      expect(mergeIntervals(ys)).toEqual(mergeIntervals(xs));
    }));
  });

    // Pattern: algebraic. Merging is idempotent: merge(merge(xs)) == merge(xs).
  it('is idempotent', () => {
    fc.assert(fc.property(intervalList, xs => {
      const once = mergeIntervals(xs);
      expect(mergeIntervals(once)).toEqual(once);
    }));
  });

    // Pattern: conditional. Already-disjoint, non-touching input comes back unchanged, just sorted.
  it('already-disjoint input is returned sorted and unchanged', () => {
    fc.assert(fc.property(disjointList, ({ sorted, shuffled }) => {
      expect(mergeIntervals(shuffled)).toEqual(sorted);
    }));
  });

    // Pattern: invariant. The input array and its intervals are not modified.
  it('does not modify its input', () => {
    fc.assert(fc.property(intervalList, xs => {
      const copy = structuredClone(xs);
      mergeIntervals(xs);
      expect(xs).toEqual(copy);
    }));
  });

  // Add your properties here. Aim for at least one of each pattern:
  // invariant, algebraic, metamorphic, differential, conditional.
});
