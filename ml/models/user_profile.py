"""
============================================================
models/user_profile.py — User Profile & Persona System
============================================================

Lightweight user profiles for personalized ranking.
Each profile is 6 numbers — enough for judges to understand,
small enough to not break anything.

Profile dimensions:
  - category_food (0-1)         How much they like food spots
  - category_outdoor (0-1)      How much they like outdoor activities
  - category_entertainment (0-1) How much they like entertainment
  - category_culture (0-1)      How much they like museums/galleries
  - price_sensitivity (0-1)     0 = budget, 1 = splurge
  - adventure_level (0-1)       0 = stick to favorites, 1 = try new things

3 seeded personas for demo. Updates persist in-memory
(Flask runs with use_reloader=False to prevent state loss).
"""

import copy
import json
import os

_PROFILES_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'user_profiles.json')

# =============================================================
# Default profile — neutral preferences (no bias)
# =============================================================
NEUTRAL_PROFILE = {
    'category_food': 0.5,
    'category_outdoor': 0.5,
    'category_entertainment': 0.5,
    'category_culture': 0.5,
    'price_sensitivity': 0.5,
    'adventure_level': 0.5,
}

# =============================================================
# Seeded personas for demo
# =============================================================
PERSONAS = {
    'alex': {
        'name': 'Alex (Norman)',
        'description': 'Chill coffee lover. Walks everywhere. Prefers cozy, affordable spots. Based in Norman.',
        'location': {'lat': 35.2087, 'lng': -97.4395},
        'city': 'Norman',
        'profile': {
            'category_food': 0.8,
            'category_outdoor': 0.2,
            'category_entertainment': 0.4,
            'category_culture': 0.3,
            'price_sensitivity': 0.3,
            'adventure_level': 0.3,
        },
    },
    'jordan': {
        'name': 'Jordan (Norman)',
        'description': 'Active and outdoorsy. Always exploring. Willing to drive for a good trail. Based in Norman.',
        'location': {'lat': 35.2226, 'lng': -97.4395},
        'city': 'Norman',
        'profile': {
            'category_food': 0.3,
            'category_outdoor': 0.9,
            'category_entertainment': 0.6,
            'category_culture': 0.1,
            'price_sensitivity': 0.5,
            'adventure_level': 0.8,
        },
    },
    'sam': {
        'name': 'Sam (Norman)',
        'description': 'Creative and cultured. Museums, galleries, bookstores. Transit rider. Based in Norman.',
        'location': {'lat': 35.2226, 'lng': -97.4395},
        'city': 'Norman',
        'profile': {
            'category_food': 0.4,
            'category_outdoor': 0.3,
            'category_entertainment': 0.5,
            'category_culture': 0.9,
            'price_sensitivity': 0.6,
            'adventure_level': 0.5,
        },
    },
    'maya_okc': {
        'name': 'Maya (OKC)',
        'description': 'Just moved to OKC after graduating. Foodie who loves trying new spots. Drives everywhere.',
        'location': {'lat': 35.4676, 'lng': -97.5164},
        'city': 'Oklahoma City',
        'profile': {
            'category_food': 0.9,
            'category_outdoor': 0.4,
            'category_entertainment': 0.7,
            'category_culture': 0.5,
            'price_sensitivity': 0.4,
            'adventure_level': 0.7,
        },
    },
    'chris_dallas': {
        'name': 'Chris (Dallas)',
        'description': 'New grad in Dallas. Social butterfly. Bars, restaurants, live music. Always down for something new.',
        'location': {'lat': 32.7767, 'lng': -96.7970},
        'city': 'Dallas',
        'profile': {
            'category_food': 0.6,
            'category_outdoor': 0.2,
            'category_entertainment': 0.9,
            'category_culture': 0.4,
            'price_sensitivity': 0.5,
            'adventure_level': 0.9,
        },
    },
}

# =============================================================
# In-memory profile store (loaded from disk or seeded)
# =============================================================
_profiles = {}

def _save_profiles():
    """Write profiles to JSON. Called after every update."""
    try:
        os.makedirs(os.path.dirname(_PROFILES_PATH), exist_ok=True)
        with open(_PROFILES_PATH, 'w') as f:
            json.dump(_profiles, f, indent=2)
    except Exception as e:
        print(f"[WARN] Failed to save profiles: {e}")

def _load_profiles():
    """Load profiles from disk. If no file, seed from PERSONAS."""
    global _profiles
    if os.path.exists(_PROFILES_PATH):
        try:
            with open(_PROFILES_PATH, 'r') as f:
                _profiles = json.load(f)
            print(f"[OK] Loaded {len(_profiles)} user profiles from disk")
            return
        except Exception as e:
            print(f"[WARN] Failed to load profiles: {e} — seeding fresh")
    # No file or load failed — seed from personas
    for user_id, persona in PERSONAS.items():
        _profiles[user_id] = copy.deepcopy(persona['profile'])
    _save_profiles()

_load_profiles()


# =============================================================
# Public API
# =============================================================

def get_profile(user_id=None):
    """
    Get a user's profile. Returns neutral if user_id is None or unknown.

    >>> get_profile('alex')['category_food']
    0.8
    >>> get_profile(None)['category_food']
    0.5
    """
    if not user_id or user_id not in _profiles:
        return copy.deepcopy(NEUTRAL_PROFILE)
    return copy.deepcopy(_profiles[user_id])


def update_profile(user_id, category, reward):
    """
    Update a user's profile based on feedback.
    Uses exponential moving average (EMA) with alpha=0.1.

    reward=1 (liked/navigated) → nudge category affinity up
    reward=0 (dismissed/shown-not-clicked) → nudge category affinity down

    >>> update_profile('alex', 'outdoor', 1)
    >>> # alex's category_outdoor increases slightly
    """
    if not user_id:
        return

    # Create profile if new user
    if user_id not in _profiles:
        _profiles[user_id] = copy.deepcopy(NEUTRAL_PROFILE)

    profile = _profiles[user_id]
    key = f'category_{category}'

    if key in profile:
        alpha = 0.1  # learning rate
        target = 1.0 if reward else 0.0
        profile[key] = profile[key] * (1 - alpha) + target * alpha
        # Clamp to 0-1
        profile[key] = max(0.0, min(1.0, round(profile[key], 3)))
        _save_profiles()


def get_all_profiles():
    """
    Get all profiles with persona metadata.
    Used by /api/profiles endpoint for frontend dropdown.

    Returns: {
        'alex': { 'name': 'Alex', 'description': '...', 'profile': {...} },
        ...
    }
    """
    result = {}
    for user_id, persona in PERSONAS.items():
        entry = {
            'name': persona['name'],
            'description': persona['description'],
            'profile': _profiles.get(user_id, copy.deepcopy(NEUTRAL_PROFILE)),
        }
        if 'location' in persona:
            entry['location'] = persona['location']
        if 'city' in persona:
            entry['city'] = persona['city']
        result[user_id] = entry
    return result


def profile_to_features(profile):
    """
    Convert profile dict to ordered feature list for ML model.
    Returns 6 floats in consistent order.

    >>> profile_to_features(NEUTRAL_PROFILE)
    [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    """
    return [
        profile.get('category_food', 0.5),
        profile.get('category_outdoor', 0.5),
        profile.get('category_entertainment', 0.5),
        profile.get('category_culture', 0.5),
        profile.get('price_sensitivity', 0.5),
        profile.get('adventure_level', 0.5),
    ]
