import random
import math


def generate_synthetic_data(n_samples=2000):
    """
    Generate synthetic training data with all 20 features (14 context + 6 user profile).

    Each sample simulates a user seeing a place recommendation and
    either engaging (label=1) or not (label=0). The label probability
    is influenced by realistic signals:
      - Category match to preferences
      - Rating quality
      - Price alignment
      - Time-of-day appropriateness
      - Distance (closer = more likely)
      - Weather × outdoor interaction
      - User profile affinity for place category (personalization)
    """
    categories = ['food', 'outdoor', 'entertainment', 'culture']
    weather_options = ['clear', 'clouds', 'rain', 'snow', 'partly_cloudy']
    training_data = []

    for _ in range(n_samples):
        # --- Simulate user preferences ---
        user_prefs = {
            'preferences': random.sample(categories, k=random.randint(1, 3)),
            'priceLevel': random.randint(1, 4),
            'duration': random.uniform(0.5, 4.0),  # hours
        }

        # --- Simulate activity/place ---
        category = random.choice(categories)
        rating = random.uniform(2.5, 5.0)
        review_count = random.randint(5, 2000)
        activity = {
            'category': category,
            'rating': round(rating, 1),
            'userRatingsTotal': review_count,
            'priceLevel': random.randint(0, 4),
            'typicalDuration': random.uniform(0.3, 3.0),  # hours
        }

        # --- Simulate context ---
        hour = random.randint(0, 23)
        day_of_week = random.randint(0, 6)
        distance_km = random.uniform(0.1, 8.0)
        weather = random.choice(weather_options)
        is_open = random.random() > 0.1  # 90% chance open

        context = {
            'hour': hour,
            'day_of_week': day_of_week,
            'distance_km': round(distance_km, 1),
            'weather': weather,
            'is_open': is_open,
            'travel_mode': random.choice(['walking', 'driving', 'transit']),
        }

        # --- Simulate user profile (personalization) ---
        user_profile = {
            'category_food': round(random.uniform(0.1, 0.9), 2),
            'category_outdoor': round(random.uniform(0.1, 0.9), 2),
            'category_entertainment': round(random.uniform(0.1, 0.9), 2),
            'category_culture': round(random.uniform(0.1, 0.9), 2),
            'price_sensitivity': round(random.uniform(0.1, 0.9), 2),
            'adventure_level': round(random.uniform(0.1, 0.9), 2),
        }

        # --- Calculate engagement probability ---
        # Start at base, add signals
        prob = 0.15  # base probability

        # Category match (+0.25)
        if category in user_prefs['preferences']:
            prob += 0.25

        # Quality signal (+0.15 for great places)
        quality = (rating / 5.0) * min(math.log(1 + review_count) / math.log(1001), 1.0)
        if quality > 0.6:
            prob += 0.15
        elif quality > 0.4:
            prob += 0.08

        # Price match (+0.10)
        if abs(activity['priceLevel'] - user_prefs['priceLevel']) <= 1:
            prob += 0.10

        # Time-of-day appropriateness (+0.15 / -0.15)
        time_matrix = {
            'food':          [0.6, 0.9, 1.0, 0.5],
            'outdoor':       [0.7, 1.0, 0.6, 0.1],
            'entertainment': [0.3, 0.7, 1.0, 0.8],
            'culture':       [0.5, 1.0, 0.7, 0.1],
        }
        if 6 <= hour < 11:     period = 0
        elif 11 <= hour < 17:  period = 1
        elif 17 <= hour < 21:  period = 2
        else:                  period = 3

        time_score = time_matrix.get(category, [0.5]*4)[period]
        if time_score >= 0.8:
            prob += 0.15
        elif time_score <= 0.2:
            prob -= 0.15

        # Distance: closer = more likely (+0.15 for very close)
        if distance_km < 1.0:
            prob += 0.15
        elif distance_km < 3.0:
            prob += 0.05
        elif distance_km > 6.0:
            prob -= 0.10

        # Weather × outdoor (-0.15 for outdoor in rain)
        if category == 'outdoor':
            if weather in ['rain', 'snow', 'thunderstorm']:
                prob -= 0.15
            elif weather == 'clear':
                prob += 0.10

        # Closed = nobody goes
        if not is_open:
            prob -= 0.30

        # Duration fit (+0.10 for good fit)
        if user_prefs['duration'] > 0:
            fill = activity['typicalDuration'] / user_prefs['duration']
            if 0.5 <= fill <= 0.9:
                prob += 0.10

        # Weekend boost for entertainment/social (+0.05)
        if day_of_week >= 5 and category in ['entertainment', 'food']:
            prob += 0.05

        # User profile affinity for this category (+0.15 / -0.10)
        affinity_key = f'category_{category}'
        user_affinity = user_profile.get(affinity_key, 0.5)
        if user_affinity > 0.6:
            prob += 0.15  # user likes this type of place
        elif user_affinity < 0.3:
            prob -= 0.10  # user doesn't care for this type

        # User price match (+0.05)
        user_price_match = 1.0 - abs(user_profile['price_sensitivity'] - activity['priceLevel'] / 4.0)
        if user_price_match > 0.7:
            prob += 0.05

        # Clamp probability
        prob = max(0.02, min(0.95, prob))

        # Generate label
        label = 1 if random.random() < prob else 0

        training_data.append({
            'activity': activity,
            'user_prefs': user_prefs,
            'context': context,
            'user_profile': user_profile,
            'label': label,
        })

    return training_data
