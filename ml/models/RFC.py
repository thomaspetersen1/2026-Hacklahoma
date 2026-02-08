# =============================================================
# LightGBM Recommender — 20-Feature Personalized Ranking Model
# =============================================================
#
# Predicts P(THIS user will engage with this place RIGHT NOW) given:
#   - Place attributes (quality, price, category)
#   - Context signals (distance, time-of-day, weather, day-of-week)
#   - Engineered features (composite quality, trending, duration fit)
#   - User profile (category affinities, price sensitivity, adventure level)
#
# LightGBM over RandomForest because:
#   - Native categorical support (no one-hot needed, but we keep it for clarity)
#   - Built-in ranking objectives (lambdarank)
#   - Trains in milliseconds, handles feature interactions better
#   - Works well with small data (< 2000 samples) with proper regularization
#
# The model is a RANKER, not a classifier. We use predict_proba
# to get a continuous score (0.0-1.0) for ranking candidates.

import numpy as np
import math
import lightgbm as lgb
import joblib
import os
from datetime import datetime


class LightGBMRecommender:
    def __init__(self):
        self.model = None
        self.feature_names = [
            # --- Place quality signals ---
            'composite_quality',      # rating * log(reviews) — Bayesian average
            'price_match',            # how close to user's budget
            'trending_score',         # newly hot vs established

            # --- Context signals ---
            'distance_decay',         # exponential decay with distance
            'time_appropriateness',   # category × time-of-day matrix
            'duration_efficiency',    # how well activity fills the time window
            'category_time_interaction',  # cross feature: category + hour
            'weather_outdoor_match',  # weather × outdoor place bonus/penalty
            'day_of_week',            # 0=Mon..6=Sun (normalized 0-1)
            'is_open',                # binary: is it open right now

            # --- Category encoding ---
            'category_food',
            'category_outdoor',
            'category_entertainment',
            'category_culture',

            # --- User profile (personalization) ---
            'user_food_affinity',       # how much this user likes food spots
            'user_outdoor_affinity',    # how much this user likes outdoor
            'user_entertainment_affinity',
            'user_culture_affinity',
            'user_price_match',         # user price pref vs place price
            'user_category_affinity',   # cross: user's affinity for THIS place's category
        ]

    # =============================================================
    # Feature Engineering — each feature is a talking point
    # =============================================================

    def composite_quality_score(self, rating, review_count):
        """
        Bayesian-average inspired quality score.

        A 5-star place with 2 reviews is probably the owner's friends.
        A 4.2-star place with 800 reviews is battle-tested quality.

        Formula: (rating / 5) * log(1 + reviews) / log(1 + 1000)
        The log compresses review count — going from 100 to 200 reviews
        matters more than going from 1000 to 1100.

        Inspired by IMDB's Top 250 weighted rating formula.
        """
        confidence = math.log(1 + review_count) / math.log(1 + 1000)
        return (rating / 5.0) * min(confidence, 1.0)

    def distance_decay_score(self, distance_km, travel_mode='walking'):
        """
        Exponential distance decay — models real human behavior.

        Research shows willingness to travel drops EXPONENTIALLY:
        the jump from 1km to 2km feels much worse than 5km to 6km.

        Lambda calibrated to college-student behavior:
          walking:  lambda=0.8  (1km=0.45, 2km=0.20)
          driving:  lambda=0.15 (5km=0.47, 10km=0.22)
          transit:  lambda=0.25 (3km=0.47, 5km=0.29)
        """
        lambdas = {'walking': 0.8, 'driving': 0.15, 'transit': 0.25}
        lam = lambdas.get(travel_mode, 0.5)
        return math.exp(-lam * distance_km)

    def time_appropriateness_score(self, category, hour):
        """
        Category × time-of-day appropriateness matrix.

        Nobody wants a museum at 11pm. Bars peak at 10pm, not 3pm.
        Cafes are morning-heavy with an afternoon study bump.

        Returns 0.0-1.0 based on a hand-tuned matrix encoding
        domain knowledge about college-student temporal behavior.
        """
        # [morning 6-11, afternoon 11-17, evening 17-21, night 21-6]
        MATRIX = {
            'food':          [0.6, 0.9, 1.0, 0.5],
            'outdoor':       [0.7, 1.0, 0.6, 0.1],
            'entertainment': [0.3, 0.7, 1.0, 0.8],
            'culture':       [0.5, 1.0, 0.7, 0.1],
        }

        if 6 <= hour < 11:     period = 0
        elif 11 <= hour < 17:  period = 1
        elif 17 <= hour < 21:  period = 2
        else:                  period = 3

        return MATRIX.get(category, [0.5, 0.5, 0.5, 0.5])[period]

    def duration_efficiency_score(self, typical_duration, available_duration):
        """
        How well does this activity fill the user's time window?

        Sweet spot: 50-90% of available time used.
        Too short (< 30%) = wasted trip. Too long (> 95%) = stressful.

        This goes beyond "does it fit" (a hard filter) to "how WELL
        does it fit" (a ranking signal).
        """
        if available_duration <= 0:
            return 0.5
        fill_ratio = typical_duration / available_duration
        if fill_ratio > 1.0:
            return 0.0      # doesn't fit — hard filter should catch this
        elif 0.5 <= fill_ratio <= 0.9:
            return 1.0      # sweet spot
        elif fill_ratio < 0.3:
            return 0.3      # too short, wasted trip
        elif fill_ratio > 0.95:
            return 0.6      # cutting it close
        else:
            return 0.7      # decent but not ideal

    def category_time_interaction_score(self, category, hour):
        """
        Explicit cross-feature between category and time-of-day.

        Tree models CAN learn interactions through splits, but explicit
        interaction features make patterns easier to learn with less data.

        Instead of needing many splits to learn "bar AND night → boost",
        this single feature encodes it directly.
        """
        cat_map = {'food': 0, 'outdoor': 1, 'entertainment': 2, 'culture': 3}
        cat_num = cat_map.get(category, 2)
        hour_norm = hour / 24.0
        return cat_num * 0.25 + hour_norm * 0.75

    def trending_score_calc(self, rating, review_count):
        """
        Approximates whether a place is trending UP.

        Places with 50-200 reviews and high ratings are often "newly hot."
        Places with 1000+ reviews are established — still good, but known.

        In production, you'd use review velocity (reviews/month).
        For the demo, bracket-based heuristic works.
        """
        if review_count < 10:
            return 0.3      # too new to tell
        elif review_count < 50 and rating >= 4.3:
            return 0.9      # new and hot
        elif review_count < 200 and rating >= 4.0:
            return 0.7      # growing
        elif review_count > 500 and rating >= 4.0:
            return 0.5      # established good
        else:
            return 0.4

    def weather_outdoor_score(self, category, weather):
        """
        Weather × outdoor place interaction.

        Don't suggest a park in the rain. Boost outdoor spots on sunny days.
        Indoor places are weather-neutral (score = 0.5).
        """
        outdoor_categories = ['outdoor']
        if category not in outdoor_categories:
            return 0.5  # weather doesn't matter for indoor places

        weather_scores = {
            'clear': 1.0,
            'sunny': 1.0,
            'clouds': 0.7,
            'partly_cloudy': 0.8,
            'overcast': 0.5,
            'rain': 0.1,
            'drizzle': 0.2,
            'snow': 0.2,
            'thunderstorm': 0.0,
        }
        return weather_scores.get(weather, 0.5)

    # =============================================================
    # Feature Extraction — builds the full 14-feature vector
    # =============================================================

    def extract_features(self, activity, user_prefs, context=None, user_profile=None):
        """
        Extract 20 numerical features from activity, user prefs, context, and user profile.

        Features are grouped by signal type:
          [0-2]   Place quality: composite quality, price match, trending
          [3-9]   Context: distance, time, duration, interaction, weather, day, open
          [10-13] Category: one-hot encoding
          [14-19] User profile: category affinities, price match, cross-feature
        """
        if context is None:
            context = {}
        if user_profile is None:
            user_profile = {}

        rating = activity.get('rating', 3.0)
        review_count = activity.get('userRatingsTotal', 100)
        category = activity.get('category', 'entertainment')
        hour = context.get('hour', datetime.now().hour)

        # Log when critical fields are defaulted — helps debug weird rankings
        aid = activity.get('id', '?')
        if 'rating' not in activity:
            print(f"[WARN] {aid}: no rating, defaulting to 3.0")
        if 'userRatingsTotal' not in activity:
            print(f"[WARN] {aid}: no review count, defaulting to 100")
        if 'category' not in activity:
            print(f"[WARN] {aid}: no category, defaulting to entertainment")

        # --- Place quality signals ---
        composite_quality = self.composite_quality_score(rating, review_count)

        activity_price = activity.get('priceLevel', 2)
        user_price = user_prefs.get('priceLevel', 2)
        price_match = 1 - abs(activity_price - user_price) / 3.0

        trending = self.trending_score_calc(rating, review_count)

        # --- Context signals ---
        distance_km = context.get('distance_km', 1.0)
        travel_mode = context.get('travel_mode', 'walking')
        distance_decay = self.distance_decay_score(distance_km, travel_mode)

        time_approp = self.time_appropriateness_score(category, hour)

        typical_dur = activity.get('typicalDuration', 1.0)
        available_dur = user_prefs.get('duration', 2.0)
        duration_eff = self.duration_efficiency_score(typical_dur, available_dur)

        cat_time = self.category_time_interaction_score(category, hour)

        weather = context.get('weather', 'clear')
        weather_match = self.weather_outdoor_score(category, weather)

        day_of_week = context.get('day_of_week', datetime.now().weekday()) / 6.0

        is_open = 1.0 if context.get('is_open', True) else 0.0

        # --- Category one-hot ---
        cat_food = 1 if category == 'food' else 0
        cat_outdoor = 1 if category == 'outdoor' else 0
        cat_entertainment = 1 if category == 'entertainment' else 0
        cat_culture = 1 if category == 'culture' else 0

        # --- User profile features (personalization) ---
        # Raw category affinities: how much does THIS user like each type?
        user_food = user_profile.get('category_food', 0.5)
        user_outdoor = user_profile.get('category_outdoor', 0.5)
        user_ent = user_profile.get('category_entertainment', 0.5)
        user_culture = user_profile.get('category_culture', 0.5)

        # User price match: how close is user's price preference to this place?
        user_price_sens = user_profile.get('price_sensitivity', 0.5)
        user_price_match = 1.0 - abs(user_price_sens - (activity_price / 4.0))

        # Cross-feature: user's affinity for THIS place's category
        # This is the key personalization signal — "does this user like this TYPE of place?"
        affinity_map = {
            'food': user_food,
            'outdoor': user_outdoor,
            'entertainment': user_ent,
            'culture': user_culture,
        }
        user_cat_affinity = affinity_map.get(category, 0.5)

        return np.array([
            composite_quality,
            price_match,
            trending,
            distance_decay,
            time_approp,
            duration_eff,
            cat_time,
            weather_match,
            day_of_week,
            is_open,
            cat_food,
            cat_outdoor,
            cat_entertainment,
            cat_culture,
            # User profile features
            user_food,
            user_outdoor,
            user_ent,
            user_culture,
            user_price_match,
            user_cat_affinity,
        ])

    # =============================================================
    # Training
    # =============================================================

    def train(self, training_data):
        """
        Train the LightGBM model on labeled data.

        training_data: list of dicts with keys:
          'activity', 'user_prefs', 'context', 'label' (1=liked, 0=not)

        LightGBM uses gradient boosting — each tree corrects the
        mistakes of all previous trees. This learns complex patterns
        like "cheap cafes in the morning" without explicit rules.
        """
        X = []
        y = []

        for sample in training_data:
            features = self.extract_features(
                sample['activity'],
                sample['user_prefs'],
                sample.get('context', {}),
                sample.get('user_profile', None)
            )
            X.append(features)
            y.append(sample['label'])

        X = np.array(X)
        y = np.array(y)

        # LightGBM doesn't need feature scaling (tree-based)
        self.model = lgb.LGBMClassifier(
            n_estimators=50,        # fewer trees — boosting converges fast
            max_depth=3,            # shallow trees prevent overfitting on small data
            num_leaves=7,           # 2^3 - 1, matches max_depth
            learning_rate=0.1,
            min_child_samples=5,    # at least 5 samples per leaf
            subsample=0.7,          # row sampling for regularization
            colsample_bytree=0.7,   # feature sampling for regularization
            reg_alpha=0.1,          # L1 regularization on leaf weights
            reg_lambda=1.0,         # L2 regularization on leaf weights
            random_state=42,
            is_unbalance=True,      # handle imbalanced like/dislike ratio
            verbose=-1,             # suppress training output
        )

        self.model.fit(X, y)

        print("[OK] LightGBM model trained successfully!")
        print(f"Feature importances:")
        for name, importance in zip(self.feature_names, self.model.feature_importances_):
            print(f"  {name}: {importance}")

        return self.model

    # =============================================================
    # Prediction — same contract as before
    # =============================================================

    def predict_scores(self, activities, user_prefs, context=None, user_profile=None):
        """
        Score all candidate activities for a specific user.
        Returns each activity with 'ml_score' added (float 0.0-1.0).

        ml_score = P(THIS user will engage with THIS place RIGHT NOW).
        Higher score = better match = ranked higher.

        When user_profile is provided, the model uses personalization
        features (category affinities, price match) to rank differently
        for different users. Same place, same time → different score
        for Alex vs Jordan.
        """
        if self.model is None:
            raise ValueError("Model not trained yet!")

        if context is None:
            context = {}

        scored_activities = []

        for activity in activities:
            # Build per-activity context (distance may vary per place)
            act_context = {**context}
            if 'travelMinutes' in activity:
                # Convert travel minutes to approximate km for distance decay
                speed_km_per_min = {'walking': 0.07, 'driving': 0.5, 'transit': 0.3}
                mode = context.get('travel_mode', 'walking')
                act_context['distance_km'] = activity['travelMinutes'] * speed_km_per_min.get(mode, 0.07)
            if 'isOpen' in activity:
                act_context['is_open'] = activity['isOpen']

            features = self.extract_features(activity, user_prefs, act_context, user_profile)
            features_2d = features.reshape(1, -1)

            # P(class=1) = probability user will engage
            score = self.model.predict_proba(features_2d)[0][1]

            scored_activities.append({
                **activity,
                'ml_score': float(score)
            })

        return scored_activities

    def recommend_top_n(self, activities, user_prefs, context=None, user_profile=None, n=5):
        """Score activities and return top N."""
        scored = self.predict_scores(activities, user_prefs, context, user_profile)
        scored.sort(key=lambda x: x['ml_score'], reverse=True)
        return scored[:n]

    # =============================================================
    # Persistence
    # =============================================================

    def save_model(self, path='models/trained/lightgbm_ranker.pkl'):
        """Save trained model to disk."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({'model': self.model}, path)
        print(f"[OK] Model saved to {path}")

    def load_model(self, path='models/trained/lightgbm_ranker.pkl'):
        """Load trained model."""
        if os.path.exists(path):
            data = joblib.load(path)
            self.model = data['model']
            print(f"[OK] Model loaded from {path}")
        else:
            print(f"[ERROR] No model found at {path}")
