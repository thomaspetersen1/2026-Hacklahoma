# =============================================================
# Thompson Sampling — Self-Learning Recommendation Layer
# =============================================================
#
# This is the "the system learns from every interaction" layer.
#
# How it works:
#   Each place gets a Beta(alpha, beta) distribution representing
#   our belief about how good it is. We SAMPLE from each distribution
#   and rank by sampled score.
#
#   - New places have Beta(1,1) = uniform = high uncertainty
#     → they sometimes sample high → get explored
#   - Well-known places have tight distributions near their true quality
#     → consistently ranked correctly → exploited
#
# The math is EXACT Bayesian updating — Beta is conjugate to
# Bernoulli, so the update is just alpha++ or beta++. No gradient
# descent, no training loop, no GPU needed.
#
# Two implementations:
#   1. ThompsonSamplingRecommender — basic bandit (one Beta per place)
#   2. ContextualThompsonSampling  — context-aware (one Beta per place × context)

import numpy as np
import json
import os
from collections import defaultdict

# Default persistence path (relative to ml/ root)
_DEFAULT_STATE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'thompson_state.json')


class ThompsonSamplingRecommender:
    """
    Basic Thompson Sampling with Beta-Bernoulli bandits.

    Each place (arm) maintains a Beta(alpha, beta) posterior.
    alpha = successes (likes, navigates) + 1 (prior)
    beta  = failures (impressions without click, dismisses) + 1 (prior)

    The +1 prior means we start with Beta(1,1) = uniform distribution,
    expressing total ignorance about the place's quality.
    """

    def __init__(self):
        self.arms = defaultdict(lambda: {'alpha': 1, 'beta': 1})

    def sample_scores(self, place_ids):
        """
        Sample a score for each place from its Beta distribution.

        The magic: np.random.beta(alpha, beta) draws one sample.
        A place with Beta(10, 2) usually samples around 0.8.
        A place with Beta(1, 1) could sample ANYTHING — that's exploration.

        Returns {place_id: sampled_score}
        """
        scores = {}
        for pid in place_ids:
            arm = self.arms[pid]
            scores[pid] = float(np.random.beta(arm['alpha'], arm['beta']))
        return scores

    def recommend_top_n(self, place_ids, n=5):
        """Sample all arms, return top N by sampled score."""
        scores = self.sample_scores(place_ids)
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return ranked[:n]

    def update(self, place_id, reward):
        """
        Update beliefs after observing feedback.

        reward = 1: user engaged (tapped "Take me there", liked, saved)
            → alpha += 1 (one more success)
        reward = 0: user didn't engage (impression only, dismissed, disliked)
            → beta += 1 (one more failure)

        This is EXACT Bayesian updating — no approximation.
        Beta is the conjugate prior for Bernoulli likelihood.
        """
        if reward == 1:
            self.arms[place_id]['alpha'] += 1
        else:
            self.arms[place_id]['beta'] += 1

    def get_stats(self, place_id):
        """Get current belief about a place — useful for demo/debug."""
        arm = self.arms[place_id]
        total = arm['alpha'] + arm['beta']
        mean = arm['alpha'] / total
        observations = total - 2  # subtract the 2 from prior

        return {
            'alpha': arm['alpha'],
            'beta': arm['beta'],
            'expected_value': round(mean, 3),
            'total_observations': observations,
            'uncertainty': 'high' if observations < 5 else 'medium' if observations < 20 else 'low',
        }

    def get_all_stats(self):
        """Get stats for all known places — for demo dashboard."""
        return {pid: self.get_stats(pid) for pid in self.arms}


class ContextualThompsonSampling:
    """
    Thompson Sampling with context partitioning.

    The same place might be great in the morning but bad at night.
    Instead of one Beta(alpha, beta) per place, we maintain one
    per (place, context_bucket) pair.

    Context buckets: time_period × category = 4 × 4 = 16 buckets
      time: morning (6-11), afternoon (11-17), evening (17-21), night (21-6)
      category: food, outdoor, entertainment, culture

    This means "Cafe X in the morning" and "Cafe X at night" are
    independent arms with independent beliefs. Context-specific learning.
    """

    def __init__(self, persist_path=None):
        # Key: (place_id, context_bucket) → {'alpha': int, 'beta': int}
        self.arms = {}
        self.persist_path = persist_path or _DEFAULT_STATE_PATH
        self._load_state()

    def _get_context_bucket(self, hour, category):
        """
        Discretize context into time_period × category buckets.
        4 time periods × 4 categories = 16 possible buckets.
        """
        if 6 <= hour < 11:     time_bucket = 'morning'
        elif 11 <= hour < 17:  time_bucket = 'afternoon'
        elif 17 <= hour < 21:  time_bucket = 'evening'
        else:                  time_bucket = 'night'

        return f"{time_bucket}_{category}"

    def _get_arm(self, place_id, context_bucket):
        """Get or create the Beta distribution for this (place, context)."""
        key = (place_id, context_bucket)
        if key not in self.arms:
            self.arms[key] = {'alpha': 1, 'beta': 1}
        return self.arms[key]

    def sample_scores(self, place_ids, categories, hour):
        """
        Sample scores for places given current context.

        Each place is scored using the Beta distribution for its
        specific (place, context_bucket) — so the same cafe gets
        different exploration behavior at 8am vs 10pm.
        """
        scores = {}
        for pid, cat in zip(place_ids, categories):
            bucket = self._get_context_bucket(hour, cat)
            arm = self._get_arm(pid, bucket)
            scores[pid] = float(np.random.beta(arm['alpha'], arm['beta']))
        return scores

    def recommend_top_n(self, place_ids, categories, hour, n=5):
        """Recommend top N places for current context."""
        scores = self.sample_scores(place_ids, categories, hour)
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return ranked[:n]

    def update(self, place_id, category, hour, reward):
        """
        Update beliefs for this (place, context) pair.

        If a user likes a cafe at 8am, that updates the
        (cafe_id, morning_food) arm — it does NOT affect
        the same cafe's evening score. Context-specific learning.
        """
        bucket = self._get_context_bucket(hour, category)
        arm = self._get_arm(place_id, bucket)

        if reward == 1:
            arm['alpha'] += 1
        else:
            arm['beta'] += 1

        self._save_state()

    def explain(self, place_id, category, hour):
        """
        Human-readable explanation for demo/judges.

        Shows why this place was scored the way it was in this context.
        """
        bucket = self._get_context_bucket(hour, category)
        arm = self._get_arm(place_id, bucket)
        mean = arm['alpha'] / (arm['alpha'] + arm['beta'])
        obs = arm['alpha'] + arm['beta'] - 2

        return {
            'context': bucket,
            'observations_in_context': obs,
            'expected_quality': round(mean, 3),
            'uncertainty': 'high' if obs < 5 else 'medium' if obs < 20 else 'low',
            'explanation': (
                f"In '{bucket}' context: {arm['alpha']-1} likes, {arm['beta']-1} skips. "
                + ("Still exploring (few observations)." if obs < 5
                   else "Good confidence in this score.")
            )
        }

    def get_all_stats(self):
        """Get stats for all (place, context) pairs — for demo."""
        stats = {}
        for (pid, bucket), arm in self.arms.items():
            mean = arm['alpha'] / (arm['alpha'] + arm['beta'])
            obs = arm['alpha'] + arm['beta'] - 2
            key = f"{pid}|{bucket}"
            stats[key] = {
                'place_id': pid,
                'context': bucket,
                'alpha': arm['alpha'],
                'beta': arm['beta'],
                'expected_value': round(mean, 3),
                'observations': obs,
            }
        return stats

    # =============================================================
    # Persistence — survive restarts without Redis/Postgres
    # =============================================================

    def _save_state(self):
        """Write bandit arms to JSON. Called after every update."""
        try:
            os.makedirs(os.path.dirname(self.persist_path), exist_ok=True)
            # Serialize tuple keys as "place_id|bucket" strings
            serializable = {}
            for (pid, bucket), arm in self.arms.items():
                serializable[f"{pid}|{bucket}"] = arm
            with open(self.persist_path, 'w') as f:
                json.dump(serializable, f, indent=2)
        except Exception as e:
            print(f"[WARN] Failed to save Thompson state: {e}")

    def _load_state(self):
        """Load bandit arms from JSON on startup. No file = fresh start."""
        if not os.path.exists(self.persist_path):
            print("[INFO] No Thompson state file — starting fresh")
            return
        try:
            with open(self.persist_path, 'r') as f:
                data = json.load(f)
            count = 0
            for key, arm in data.items():
                parts = key.split('|', 1)
                if len(parts) == 2:
                    self.arms[(parts[0], parts[1])] = arm
                    count += 1
            print(f"[OK] Loaded {count} Thompson arms from disk")
        except Exception as e:
            print(f"[WARN] Failed to load Thompson state: {e} — starting fresh")
