# RANDDOM FOREST RECOMMENDER
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os

class RandomForestRecommender:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'rating',
            'popularity_score',
            'price_match',
            'duration_match',
            'category_food',
            'category_outdoor',
            'category_entertainment',
            'category_culture'
        ]
        
    def extract_features(self, activity, user_prefs):
        """
        Extract numerical features from activity and user preferences
        """
        # Rating (0-5 scale, normalize to 0-1)
        rating = activity.get('rating', 3.0) / 5.0
        
        # Popularity score (normalize by 1000 reviews = very popular)
        popularity = min(activity.get('userRatingsTotal', 0) / 1000, 1.0)
        
        # Price match (how close to user's preference)
        activity_price = activity.get('priceLevel', 2)
        user_price = user_prefs.get('priceLevel', 2)
        price_match = 1 - abs(activity_price - user_price) / 3.0
        
        # Duration match
        activity_duration = activity.get('typicalDuration', 2.0)
        user_duration = user_prefs.get('duration', 2.0)
        duration_match = max(0, 1 - abs(activity_duration - user_duration) / 4.0)
        
        # Category one-hot encoding
        category = activity.get('category', 'entertainment')
        cat_food = 1 if category == 'food' else 0
        cat_outdoor = 1 if category == 'outdoor' else 0
        cat_entertainment = 1 if category == 'entertainment' else 0
        cat_culture = 1 if category == 'culture' else 0
        
        return np.array([
            rating,
            popularity,
            price_match,
            duration_match,
            cat_food,
            cat_outdoor,
            cat_entertainment,
            cat_culture
        ])
    
    def train(self, training_data):
        """
        Train the Random Forest model
        training_data: list of dict with keys 'activity', 'user_prefs', 'label' (1=liked, 0=not)
        """
        X = []
        y = []
        
        for sample in training_data:
            features = self.extract_features(sample['activity'], sample['user_prefs'])
            X.append(features)
            y.append(sample['label'])
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest
        self.model = RandomForestClassifier(
            n_estimators=100,      # 100 trees
            max_depth=10,          # Max depth of each tree
            min_samples_split=5,   # Min samples to split a node
            random_state=42,
            class_weight='balanced'  # Handle imbalanced data
        )
        
        self.model.fit(X_scaled, y)
        
        print("✅ Model trained successfully!")
        print(f"Feature importances:")
        for name, importance in zip(self.feature_names, self.model.feature_importances_):
            print(f"  {name}: {importance:.3f}")
        
        return self.model
    
    def predict_scores(self, activities, user_prefs):
        """
        Predict probability scores for list of activities
        Returns list of activities with 'ml_score' added
        """
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        scored_activities = []
        
        for activity in activities:
            features = self.extract_features(activity, user_prefs)
            features_scaled = self.scaler.transform([features])
            
            # Get probability of class 1 (user will like it)
            score = self.model.predict_proba(features_scaled)[0][1]
            
            scored_activities.append({
                **activity,
                'ml_score': float(score)
            })
        
        return scored_activities
    
    def recommend_top_n(self, activities, user_prefs, n=5):
        """
        Score activities and return top N
        """
        scored = self.predict_scores(activities, user_prefs)
        
        # Sort by score descending
        scored.sort(key=lambda x: x['ml_score'], reverse=True)
        
        return scored[:n]
    
    def save_model(self, path='models/trained/random_forest.pkl'):
        """Save trained model and scaler"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler
        }, path)
        print(f"✅ Model saved to {path}")
    
    def load_model(self, path='models/trained/random_forest.pkl'):
        """Load trained model and scaler"""
        if os.path.exists(path):
            data = joblib.load(path)
            self.model = data['model']
            self.scaler = data['scaler']
            print(f"✅ Model loaded from {path}")
        else:
            print(f"❌ No model found at {path}")