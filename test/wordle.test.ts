import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
const letters = (alpha: string) => fc.constantFrom(...alpha.split(''));
const wordFrom = (alpha: string) =>
  fc.array(letters(alpha), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));
const word = fc.oneof(wordFrom('ABC'), wordFrom(ALPHABET));
const count = (s: string, ch: string) => s.split('').filter(c => c === ch).length;

describe('matchGuess', () => {
    // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(fc.property(word, word, (s, g) => {
      expect(matchGuess(s, g)).toHaveLength(5);
    }));
  });

  // Pattern: invariant. Every color is G, Y or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(fc.property(word, word, (s, g) => {
      for (const c of matchGuess(s, g)) expect(['G', 'Y', 'B']).toContain(c);
    }));
  });
    // Pattern: conditional. Guessing the secret gives all greens.
  it('guessing the secret gives all greens', () => {
    fc.assert(fc.property(word, s => {
      expect(matchGuess(s, s)).toEqual(['G', 'G', 'G', 'G', 'G']);
    }));
  });
    // Pattern: invariant. A letter is never credited (G or Y) more often than the secret contains it.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(fc.property(word, word, (s, g) => {
      const r = matchGuess(s, g);
      for (const ch of new Set(g)) {
        const credited = [...g].filter((c, i) => c === ch && r[i] !== 'B').length;
        expect(credited).toBeLessThanOrEqual(count(s, ch));
      }
    }));
  });

    // Pattern: conditional. If the guess is a rearrangement of the secret, nothing is black.
  it('an anagram of the secret has no blacks', () => {
    const pair = word.chain(s =>
      fc.shuffledSubarray(s.split(''), { minLength: 5, maxLength: 5 })
        .map(cs => [s, cs.join('')] as const));
    fc.assert(fc.property(pair, ([s, g]) => {
      expect(matchGuess(s, g)).not.toContain('B');
    }));
  });

    // Pattern: invariant. Position i is green exactly when guess[i] === secret[i].
  it('green exactly where letters match', () => {
    fc.assert(fc.property(word, word, (s, g) => {
      const r = matchGuess(s, g);
      for (let i = 0; i < 5; i++) expect(r[i] === 'G').toBe(s[i] === g[i]);
    }));
  });

  // Pattern: conditional. A guess sharing no letters with the secret is all black.
  it('disjoint letters give all blacks', () => {
    const pair = fc.shuffledSubarray(ALPHABET.split(''), { minLength: 26, maxLength: 26 })
      .chain(perm => fc.tuple(wordFrom(perm.slice(0, 13).join('')), wordFrom(perm.slice(13).join(''))));
    fc.assert(fc.property(pair, ([s, g]) => {
      expect(matchGuess(s, g)).toEqual(['B', 'B', 'B', 'B', 'B']);
    }));
  });

  // Pattern: metamorphic. Renaming letters with a one-to-one mapping does not change the colors.
  it('renaming letters consistently does not change the result', () => {
    fc.assert(fc.property(word, word,
      fc.shuffledSubarray(ALPHABET.split(''), { minLength: 26, maxLength: 26 }),
      (s, g, perm) => {
        const rename = (w: string) => [...w].map(c => perm[ALPHABET.indexOf(c)]).join('');
        expect(matchGuess(rename(s), rename(g))).toEqual(matchGuess(s, g));
      }));
  });
});
