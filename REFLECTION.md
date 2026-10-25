# Reflection

**Name / Andrew ID:** Xinrui (Leo) Liu / xinruil3

**Recitation group members (Task 2):** None. I missed recitation and did Task 2 alone.

---

### 1. Valid but weak

`returns exactly five colors` kills 0 of 5 mutants. It is still valid because the spec says the result has five colors, so it never fails on a correct implementation; every mutant just returns five *wrong* colors. It would catch an implementation that only pushes colors for non-green positions, which returns 4 colors for `matchGuess('APPLE', 'ALLEY')`.

### 2. A generator problem, not a property problem

`touchingNotMerged` was flaky. My invariant already required `out[i][1] < out[i + 1][0]`, but my generator used endpoints in -1000..1000, so intervals almost never shared an endpoint. I shrank the range to -10..10 with lengths 0..5.

Before:
```
  ~ touchingNotMerged       flaky: killed in 2/5 runs  by: order and duplicates do not matter
Mutation score: 6/7 killed (86%)
```
After:
```
  ✔ touchingNotMerged       killed  by: output is sorted with gaps between intervals; order and duplicates do not matter
      Counterexample: [[[-1,-1],[-1,-1]]]
Mutation score: 7/7 killed (100%)
```

### 3. Reading a counterexample

```
  ✔ mergesIntegerNeighbors  killed  by: covers exactly the same points as the input
      Counterexample: [[[2,2],[-3,1]]]
      AssertionError: expected true to be false // Object.is equality
```
The spec says the output must cover exactly the same points, including all real numbers. `[-3, 1]` and `[2, 2]` leave a gap at 1 < x < 2, but the mutant merges them into `[-3, 2]`, so x = 1.5 is covered by the output but not by the input.

### 4. Your project

`Wildcard.match(input, pattern)` in opencode, which checks permission rules like `git *` against commands.

- **Conditional:** a pattern with no `*`, `?` or `\` matches only itself (`match(x, p) === (x === p)`).
- **Metamorphic:** for a literal command `c`, adding `" " + args` to the input keeps it matching `c + " *"`.

Generator: strings that include regex characters (`. + ( ) [ ] $`), spaces and newlines, with `x` built from `p` (equal or one character off). A naive generator of letters never tests escaping, and two random strings are almost never equal, so the first property would never test a real match.