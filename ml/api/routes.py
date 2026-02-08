from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.RFC import LightGBMRecommender
from models.thompson import ContextualThompsonSampling
from models.vibe_profiler import build_vibe_profile, get_vibe_vector
from models.user_profile import get_profile, update_profile, get_all_profiles

router = APIRouter()

# Load model on startup
recommender = LightGBMRecommender()
ML_DIR = os.path.join(os.path.dirname(__file__), '..')
recommender.load_model(os.path.join(ML_DIR, 'models', 'trained', 'lightgbm_ranker.pkl'))

# Initialize Thompson Sampling bandit (in-memory, resets on restart)
bandit = ContextualThompsonSampling()


# =============================================================
# POST /api/recommend — LightGBM scoring (existing, upgraded)
# =============================================================

@router.post('/recommend')
async def recommend(data: dict):
    """
    Score candidates using LightGBM model with 20 features (14 context + 6 user profile).

    Input: {
        "activities": [...],
        "userPreferences": { "preferences", "priceLevel", "duration" },
        "context": { "hour", "dayOfWeek", "weather", "travelMinutesMap" },
        "userId": "alex"  // optional — loads user profile for personalized scoring
    }
    Output: { "success": true, "recommendations": [...with ml_score] }
    """
    try:
        activities = data.get('activities', [])
        user_prefs = data.get('userPreferences', {})

        if not activities:
            return {
                'success': True,
                'recommendations': [],
                'message': 'No activities to score'
            }

        # Build context from request (new fields from server)
        raw_context = data.get('context', {})
        context = {
            'hour': raw_context.get('hour', None),
            'day_of_week': raw_context.get('dayOfWeek', None),
            'weather': raw_context.get('weather', 'clear'),
            'travel_mode': raw_context.get('travelMode', 'walking'),
        }

        # Per-activity travel minutes (for distance decay)
        travel_map = raw_context.get('travelMinutesMap', {})
        for act in activities:
            if act.get('id') and act['id'] in travel_map:
                act['travelMinutes'] = travel_map[act['id']]
            if 'isOpen' not in act:
                act['isOpen'] = True

        # Load user profile for personalized scoring
        user_id = data.get('userId', None)
        user_profile = get_profile(user_id)

        # Score ALL candidates with user profile (LightGBM base scores)
        scored = recommender.predict_scores(activities, user_prefs, context, user_profile)

        # Blend Thompson sampling scores into the final ranking.
        hour = context.get('hour', 12)
        place_ids = [a.get('id', '') for a in scored]
        categories = [a.get('category', 'entertainment') for a in scored]
        thompson_scores = bandit.sample_scores(place_ids, categories, hour)

        for activity in scored:
            aid = activity.get('id', '')
            lgbm_score = activity.get('ml_score', 0.5)
            ts_score = thompson_scores.get(aid, 0.5)
            activity['ml_score'] = round(0.7 * lgbm_score + 0.3 * ts_score, 4)
            activity['lgbm_score'] = round(lgbm_score, 4)
            activity['thompson_score'] = round(ts_score, 4)

        # Re-sort by blended score
        scored.sort(key=lambda x: x.get('ml_score', 0), reverse=True)

        return {
            'success': True,
            'recommendations': scored,
            'total_scored': len(activities),
            'userId': user_id,
            'profileUsed': user_id is not None,
            'scoring': 'lgbm+thompson',
        }

    except Exception as e:
        print(f"Error in /recommend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================
# POST /api/thompson — Thompson Sampling scoring
# =============================================================

@router.post('/thompson')
async def thompson_score(data: dict):
    """
    Get Thompson Sampling scores for candidates.

    Input: { "place_ids": [...], "categories": [...], "hour": 14 }
    Output: { "scores": { "place_id": 0.73, ... }, "source": "thompson" }
    """
    try:
        place_ids = data.get('place_ids', [])
        categories = data.get('categories', [])
        hour = data.get('hour', 12)

        scores = bandit.sample_scores(place_ids, categories, hour)

        return {
            'success': True,
            'scores': scores,
            'source': 'thompson'
        }

    except Exception as e:
        print(f"Error in /thompson: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================
# GET /api/thompson/stats — Bandit state for demo
# =============================================================

@router.get('/thompson/stats')
async def thompson_stats():
    """
    Returns all bandit arm stats for demo visualization.
    Shows alpha, beta, expected_value, observations per (place, context).
    """
    stats = bandit.get_all_stats()
    return {
        'success': True,
        'arms': stats,
        'total_arms': len(stats),
    }


# =============================================================
# POST /api/feedback — Feed the learning loop
# =============================================================

REWARD_MAP = {
    'navigate': 1,   # tapped "Take me there" — strongest positive
    'like': 1,        # explicit like
    'save': 1,        # saved for later
    'click': None,    # ambiguous — skip for now
    'impression': 0,  # shown but not engaged — weak negative
    'dismiss': 0,     # actively swiped away
    'dislike': 0,     # explicit dislike
}

@router.post('/feedback')
async def feedback(data: dict):
    """
    Receive feedback events and update both Thompson Sampling bandit
    AND user profile (if userId provided).

    Input: {
        "place_id": "ChIJ...",
        "category": "food",
        "hour": 14,
        "event_type": "impression" | "click" | "navigate" | "like" | "dislike" | ...,
        "userId": "alex"  // optional — updates user profile on feedback
    }
    Output: { "success": true, "stats": { current belief about this place } }
    """
    try:
        place_id = data.get('place_id')
        category = data.get('category', 'entertainment')
        hour = data.get('hour', 12)
        event_type = data.get('event_type', 'impression')
        user_id = data.get('userId', None)

        reward = REWARD_MAP.get(event_type)

        if reward is not None:
            # Update Thompson Sampling bandit
            bandit.update(place_id, category, hour, reward)

            # Update user profile (nudge category affinity)
            if user_id:
                update_profile(user_id, category, reward)

        # Return current stats for this place in this context
        stats = bandit.explain(place_id, category, hour)

        # Include updated profile if userId provided
        response = {
            'success': True,
            'event_type': event_type,
            'reward': reward,
            'stats': stats,
        }
        if user_id:
            response['updatedProfile'] = get_profile(user_id)

        return response

    except Exception as e:
        print(f"Error in /feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================
# POST /api/vibe-profile — Place vibe analysis
# =============================================================

@router.post('/vibe-profile')
async def vibe_profile(data: dict):
    """
    Get vibe profile for a place.

    Input: {
        "place_type": "cafe",
        "reviews": ["Great quiet spot...", "Love the wifi..."]  // optional
    }
    Output: { "vibes": { "chill": 0.8, "social": 0.3, ... } }
    """
    try:
        place_type = data.get('place_type', 'cafe')
        reviews = data.get('reviews', None)

        profile = build_vibe_profile(place_type, reviews)
        vector = get_vibe_vector(profile)

        return {
            'success': True,
            'vibes': profile,
            'vibe_vector': vector,
            'source': 'reviews' if reviews else 'place_type_default',
        }

    except Exception as e:
        print(f"Error in /vibe-profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================
# GET /api/profiles — List all personas (for frontend dropdown)
# =============================================================

@router.get('/profiles')
async def list_profiles():
    """
    Returns all seeded personas with their current profiles.
    Used by the frontend /profile page to populate the persona dropdown.
    """
    profiles = get_all_profiles()
    return {
        'success': True,
        'profiles': profiles,
    }


@router.get('/profiles/{user_id}')
async def get_single_profile(user_id: str):
    """
    Returns a single user's profile.
    """
    profile = get_profile(user_id)
    return {
        'success': True,
        'userId': user_id,
        'profile': profile,
    }


# =============================================================
# GET /api/health — Health check
# =============================================================

@router.get('/health')
async def health():
    model_loaded = recommender.model is not None
    return {
        'status': 'ok',
        'model_loaded': model_loaded,
        'model_type': 'LightGBM',
        'features': len(recommender.feature_names),
        'thompson_arms': len(bandit.arms),
    }
