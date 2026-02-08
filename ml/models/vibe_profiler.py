# =============================================================
# Vibe Profiler — Place Atmosphere Understanding
# =============================================================
#
# Google tells us a place is a "cafe" with 4.2 stars.
# But is it a quiet study spot or a loud social hangout?
#
# The vibe profiler builds an atmosphere profile for each place:
#   - From review text (keyword frequency matching)
#   - From place type defaults (seed values when no reviews available)
#
# This is the "shovel" — our proprietary data layer on top of Google.
# It's what makes us more than a wrapper.
#
# 6 vibe dimensions:
#   chill          — quiet, relaxed, good for reading/thinking
#   social         — lively, groups, meetups, energy
#   studious       — wifi, outlets, quiet focus, productive
#   trendy         — aesthetic, instagram-worthy, hip
#   date_spot      — romantic, intimate, ambiance
#   budget_friendly — cheap, affordable, student-friendly

# =============================================================
# Keyword dictionaries for each vibe dimension
# =============================================================

VIBE_KEYWORDS = {
    'chill': [
        'quiet', 'relaxing', 'peaceful', 'calm', 'cozy', 'chill',
        'laid-back', 'mellow', 'serene', 'comfortable', 'homey',
        'intimate', 'warm', 'reading', 'unwind',
    ],
    'social': [
        'groups', 'friends', 'lively', 'fun', 'crowded', 'social',
        'party', 'loud', 'energetic', 'meetup', 'hangout', 'bustling',
        'vibrant', 'gathering', 'community',
    ],
    'studious': [
        'wifi', 'study', 'laptop', 'outlets', 'quiet', 'workspace',
        'focus', 'productive', 'library', 'plugs', 'working',
        'concentrate', 'homework', 'remote work',
    ],
    'trendy': [
        'instagram', 'aesthetic', 'hip', 'trendy', 'artisan', 'craft',
        'unique', 'photogenic', 'modern', 'vibes', 'stylish',
        'design', 'curated', 'hipster',
    ],
    'date_spot': [
        'romantic', 'intimate', 'ambiance', 'candlelit', 'date',
        'couples', 'special', 'wine', 'anniversary', 'cozy',
        'charming', 'elegant',
    ],
    'budget_friendly': [
        'cheap', 'affordable', 'budget', 'inexpensive', 'deal',
        'value', 'student', 'free', 'bargain', 'reasonable',
        'worth', 'price',
    ],
}

# =============================================================
# Default vibe profiles by Google place type
# =============================================================
# These seed the vibe profile when no review text is available.
# Each score is 0.0-1.0 representing how strongly this place type
# typically exhibits each vibe.

PLACE_TYPE_DEFAULTS = {
    'cafe': {
        'chill': 0.7, 'social': 0.4, 'studious': 0.6,
        'trendy': 0.5, 'date_spot': 0.4, 'budget_friendly': 0.5,
    },
    'coffee_shop': {
        'chill': 0.7, 'social': 0.3, 'studious': 0.7,
        'trendy': 0.5, 'date_spot': 0.3, 'budget_friendly': 0.5,
    },
    'library': {
        'chill': 0.8, 'social': 0.1, 'studious': 0.9,
        'trendy': 0.1, 'date_spot': 0.1, 'budget_friendly': 0.9,
    },
    'book_store': {
        'chill': 0.8, 'social': 0.2, 'studious': 0.6,
        'trendy': 0.4, 'date_spot': 0.3, 'budget_friendly': 0.5,
    },
    'bakery': {
        'chill': 0.6, 'social': 0.4, 'studious': 0.2,
        'trendy': 0.5, 'date_spot': 0.5, 'budget_friendly': 0.5,
    },
    'bar': {
        'chill': 0.2, 'social': 0.9, 'studious': 0.0,
        'trendy': 0.5, 'date_spot': 0.6, 'budget_friendly': 0.3,
    },
    'restaurant': {
        'chill': 0.4, 'social': 0.7, 'studious': 0.1,
        'trendy': 0.5, 'date_spot': 0.7, 'budget_friendly': 0.3,
    },
    'park': {
        'chill': 0.8, 'social': 0.5, 'studious': 0.2,
        'trendy': 0.2, 'date_spot': 0.5, 'budget_friendly': 0.9,
    },
    'museum': {
        'chill': 0.5, 'social': 0.3, 'studious': 0.4,
        'trendy': 0.6, 'date_spot': 0.7, 'budget_friendly': 0.4,
    },
    'art_gallery': {
        'chill': 0.6, 'social': 0.3, 'studious': 0.3,
        'trendy': 0.8, 'date_spot': 0.7, 'budget_friendly': 0.4,
    },
    'gym': {
        'chill': 0.1, 'social': 0.5, 'studious': 0.0,
        'trendy': 0.3, 'date_spot': 0.1, 'budget_friendly': 0.4,
    },
    'bowling_alley': {
        'chill': 0.3, 'social': 0.9, 'studious': 0.0,
        'trendy': 0.3, 'date_spot': 0.6, 'budget_friendly': 0.5,
    },
    'sports_complex': {
        'chill': 0.1, 'social': 0.7, 'studious': 0.0,
        'trendy': 0.2, 'date_spot': 0.2, 'budget_friendly': 0.5,
    },
    'campground': {
        'chill': 0.7, 'social': 0.4, 'studious': 0.1,
        'trendy': 0.1, 'date_spot': 0.4, 'budget_friendly': 0.8,
    },
}

# Default for unknown place types
DEFAULT_VIBE = {
    'chill': 0.5, 'social': 0.5, 'studious': 0.3,
    'trendy': 0.3, 'date_spot': 0.3, 'budget_friendly': 0.5,
}


def build_vibe_profile(place_type, reviews_text_list=None):
    """
    Build a vibe profile for a place.

    Two modes:
      1. No reviews: return seed defaults for the place type
      2. With reviews: analyze keyword frequency to compute scores

    Args:
        place_type: Google place type (e.g., 'cafe', 'bar')
        reviews_text_list: optional list of review strings

    Returns:
        dict of {vibe_name: score} where score is 0.0-1.0
    """
    # Start with seed defaults for this place type
    base_profile = PLACE_TYPE_DEFAULTS.get(place_type, DEFAULT_VIBE).copy()

    # If no reviews, return the seed profile
    if not reviews_text_list or len(reviews_text_list) == 0:
        return base_profile

    # Analyze review text to compute vibe scores
    all_text = ' '.join(reviews_text_list).lower()

    review_scores = {}
    for vibe, keywords in VIBE_KEYWORDS.items():
        # Count how many keywords appear in the reviews
        hits = sum(1 for kw in keywords if kw in all_text)
        # Normalize: what fraction of our keywords appeared?
        raw_score = hits / len(keywords)
        # Scale up (hitting 30% of keywords = strong signal)
        review_scores[vibe] = min(raw_score * 3.0, 1.0)

    # Blend: 40% seed defaults + 60% review analysis
    # Seed provides stability, reviews provide specificity
    blended = {}
    for vibe in VIBE_KEYWORDS:
        seed = base_profile.get(vibe, 0.5)
        review = review_scores.get(vibe, 0.5)
        blended[vibe] = round(0.4 * seed + 0.6 * review, 2)

    return blended


def get_vibe_vector(profile):
    """
    Convert a vibe profile dict to a fixed-order vector.
    Useful as features for the ML model.

    Returns: [chill, social, studious, trendy, date_spot, budget_friendly]
    """
    order = ['chill', 'social', 'studious', 'trendy', 'date_spot', 'budget_friendly']
    return [profile.get(v, 0.5) for v in order]
