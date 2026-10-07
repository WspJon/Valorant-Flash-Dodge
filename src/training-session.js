export const TRAINING_SETTINGS = Object.freeze({ minDelay: 1.5, maxDelay: 3.5 });

// Updated only at activation. Reaction averages include valid successful dodges.
export class SessionStats {
  constructor() { this.reset(); }
  reset() {
    this.attempts = 0;
    this.dodges = 0;
    this.reactionCount = 0;
    this.reactionTotal = 0;
    this.best = null;
  }
  record(result, reaction) {
    if (reaction.invalidReason) return false;
    this.attempts += 1;
    if (result === 'DODGED') {
      this.dodges += 1;
      if (reaction.reactionMs !== null && Number.isFinite(reaction.reactionMs)) {
        this.reactionCount += 1;
        this.reactionTotal += reaction.reactionMs;
        this.best = this.best === null ? reaction.reactionMs : Math.min(this.best, reaction.reactionMs);
      }
    }
    return true;
  }
  get successRate() { return this.attempts ? this.dodges / this.attempts * 100 : 0; }
  get average() { return this.reactionCount ? this.reactionTotal / this.reactionCount : null; }
}

export class AttemptScheduler {
  constructor(settings = TRAINING_SETTINGS, random = Math.random) {
    this.settings = settings;
    this.random = random;
    this.schedule();
  }
  schedule() {
    const { minDelay, maxDelay } = this.settings;
    this.remaining = minDelay + this.random() * (maxDelay - minDelay);
    this.waiting = true;
  }
  update(delta) {
    if (!this.waiting) return false;
    this.remaining = Math.max(0, this.remaining - delta);
    if (this.remaining > 0) return false;
    this.waiting = false;
    return true;
  }
  launchNow() { this.waiting = false; }
}
