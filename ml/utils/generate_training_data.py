import random

def generate_synthetic_data(n_samples=1000):
    """
    Generate synthetic training data
    This simulates user preferences and whether they liked activities
    """
    categories = ['food', 'outdoor', 'entertainment', 'culture']
    training_data = []
    
    for _ in range(n_samples):
        # Simulate user preferences
        user_prefs = {
            'preferences': random.sample(categories, k=random.randint(1, 3)),
            'priceLevel': random.randint(1, 4),
            'duration': random.uniform(1, 6)
        }
        
        # Simulate activity
        category = random.choice(categories)
        activity = {
            'category': category,
            'rating': random.uniform(3.0, 5.0),
            'userRatingsTotal': random.randint(0, 2000),
            'priceLevel': random.randint(1, 4),
            'typicalDuration': random.uniform(0.5, 6.0)
        }
        
        # Simulate label (1=liked, 0=not liked)
        # User more likely to like if:
        # - Category matches preference
        # - High rating
        # - Price matches
        label = 0
        
        like_probability = 0.2  # Base probability
        
        if category in user_prefs['preferences']:
            like_probability += 0.4
        
        if activity['rating'] > 4.0:
            like_probability += 0.2
        
        if abs(activity['priceLevel'] - user_prefs['priceLevel']) <= 1:
            like_probability += 0.2
        
        label = 1 if random.random() < like_probability else 0
        
        training_data.append({
            'activity': activity,
            'user_prefs': user_prefs,
            'label': label
        })
    
    return training_data