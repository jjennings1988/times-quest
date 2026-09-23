# Device pass and child pilot (0.24)

Code can't check the parts of this release that matter most. Run this plan before
widening the beta. Use test profiles. Never test on a child's real profile.

## 1. Device pass (about 45 minutes per device)

Devices: iPhone SE-size, a current iPhone, iPad (portrait and landscape), and the
slowest school Chromebook available. Test iOS in **Safari** and again after
**Add to Home Screen**.

For each device:

1. Open **Parents → Device check for testing** and tap **Copy report**. Paste it
   into the test log.
2. Create a profile, play Zero Marsh to star 2, and do one family lesson.
   - The prediction question and the lesson's choices are visible without
     scrolling.
   - In every question, the GO key is visible without scrolling. Check with the
     on-screen keyboard both hidden and shown (use the lesson's "How many
     altogether?" box).
   - Nothing sits under the notch, the home indicator, or the status bar,
     including in landscape.
3. Open Willowbrook and walk around for 3 minutes. Then open Device check again.
   - **Proposed budget, not yet measured:** median ≤ 33 ms per frame, and the
     slowest 5% ≤ 50 ms. If the camp is slower, it should offer low power once.
     Accept it and repeat the measurement.
4. Leave the camp open for 30 minutes. It should not crash, go blank, or reload.
5. Turn on airplane mode, close the app, and reopen it. The map, a lesson and a
   guardian encounter should work offline.
6. **Safari only:** do not open the game for 8 days. Then check that the
   profile is still there, and record whether the Parents screen says saves are
   kept.

Record failures with the copied report and a screenshot.

## 2. Child pilot: ×4 and ×7 lessons (4–5 children, grades 2–5)

Two sessions, two days apart, about 20 minutes each. An adult watches without
prompting. Help is given only through the game's "Show me" button.

**Session 1**
- ×4 lesson (Squarestone), then the four independent problems.
- ×7 lesson (Storm Peak), then the four independent problems. Use a test profile
  with those routes opened.
- After each lesson, ask: "How would you work out 4 × 9 without counting?" Note
  whether the child names doubling, or five groups plus two groups.

**Session 2**
- Without any lesson, give three ×4 and three ×7 facts the child has not seen
  (use Practice), plus one reversed fact (for example, 8 × 7).

**Observe and record**
- Taps on a choice that wasn't a real decision ("just pressed the button").
- Whether any child got stuck on a prediction and why.
- Reading help requested: which sentence caused it.
- Time spent per phase, and any point where the child wanted to quit.

**Success** (decide before running): at least 3 of 5 children explain a strategy
in their own words, and get at least 4 of the 7 session-2 items right on their
own.

If the pilot misses, change the lesson pattern before the 0.26 lesson-variety
work is copied to more families.
