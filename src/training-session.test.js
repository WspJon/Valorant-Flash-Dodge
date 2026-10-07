import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionStats, AttemptScheduler } from './training-session.js';

test('stats count outcomes and average only valid successful reaction samples', () => {
  const stats = new SessionStats();
  const reaction = reactionMs => ({ reactionMs, invalidReason: null });
  stats.record('FULL FLASH', reaction(null));
  stats.record('PARTIALLY FLASHED', reaction(100));
  stats.record('DODGED', reaction(200));
  stats.record('DODGED', reaction(300));
  stats.record('DODGED', reaction(null));
  assert.equal(stats.attempts, 5);
  assert.equal(stats.dodges, 3);
  assert.equal(stats.successRate, 60);
  assert.equal(stats.best, 200);
  assert.equal(stats.average, 250);
  assert.equal(stats.reactionCount, 2);
});

test('interrupted attempts do not affect stats; reset clears the session', () => {
  const stats = new SessionStats();
  assert.equal(stats.record('DODGED', { reactionMs: 50, invalidReason: 'attempt paused' }), false);
  assert.equal(stats.record('FULL FLASH', { reactionMs: null, invalidReason: 'frame delay' }), false);
  assert.equal(stats.attempts, 0);
  stats.record('DODGED', { reactionMs: 200, invalidReason: null });
  stats.reset();
  assert.equal(stats.attempts, 0);
  assert.equal(stats.successRate, 0);
  assert.equal(stats.average, null);
  assert.equal(stats.best, null);
});

test('random wait bounds, one launch per wait, manual skip, and rescheduling', () => {
  const scheduler = new AttemptScheduler({ minDelay: 1.5, maxDelay: 3.5 }, () => 0);
  assert.equal(scheduler.remaining, 1.5);
  assert.equal(scheduler.update(1), false);
  assert.equal(scheduler.remaining, 0.5);
  assert.equal(scheduler.update(0.5), true);
  assert.equal(scheduler.update(10), false);
  scheduler.random = () => 1;
  scheduler.schedule();
  assert.equal(scheduler.remaining, 3.5);
  scheduler.launchNow();
  assert.equal(scheduler.update(10), false);
  scheduler.schedule();
  assert.equal(scheduler.update(3.5), true);
});
