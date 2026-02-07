from flask import Blueprint, request, jsonify
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.RFC import RandomForestRecommender

api_bp = Blueprint('api', __name__)

# Load model on startup
recommender = RandomForestRecommender()
recommender.load_model('src/models/trained/random_forest.pkl')

@api_bp.route('/recommend', methods=['POST'])
def recommend():
    """
    Input: {
        "activities": [...],  // Filtered activities from Google Maps
        "userPreferences": {
            "preferences": ["food", "outdoor"],
            "priceLevel": 2,
            "duration": 2
        }
    }
    Output: Top 5 activities with ml_score
    """
    try:
        data = request.json
        activities = data['activities']
        user_prefs = data['userPreferences']
        
        if not activities:
            return jsonify({
                'success': True,
                'recommendations': [],
                'message': 'No activities to score'
            })
        
        # Get top 5 recommendations
        top_5 = recommender.recommend_top_n(activities, user_prefs, n=5)
        
        return jsonify({
            'success': True,
            'recommendations': top_5,
            'total_scored': len(activities)
        })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api_bp.route('/health', methods=['GET'])
def health():
    model_loaded = recommender.model is not None
    return jsonify({
        'status': 'ok',
        'model_loaded': model_loaded
    })