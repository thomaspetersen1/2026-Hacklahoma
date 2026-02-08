import sys
sys.path.append('.')

from models.RFC import LightGBMRecommender
from utils.generate_training_data import generate_synthetic_data


def main():
    print("Training LightGBM Recommender (14 features)...")

    # Generate synthetic training data with context
    print("Generating synthetic training data...")
    training_data = generate_synthetic_data(n_samples=2000)

    positive = sum(1 for s in training_data if s['label'] == 1)
    print(f"  Generated {len(training_data)} samples")
    print(f"  Positive: {positive} ({positive/len(training_data)*100:.0f}%)")
    print(f"  Negative: {len(training_data) - positive} ({(len(training_data)-positive)/len(training_data)*100:.0f}%)")

    # Train model
    recommender = LightGBMRecommender()
    recommender.train(training_data)

    # Save model
    recommender.save_model()

    # Quick test
    print("\nQuick test with sample prediction:")
    test_activities = [
        {
            'id': 'test_cafe',
            'rating': 4.5,
            'userRatingsTotal': 200,
            'priceLevel': 2,
            'typicalDuration': 0.5,
            'category': 'food',
        },
        {
            'id': 'test_park',
            'rating': 4.0,
            'userRatingsTotal': 50,
            'priceLevel': 0,
            'typicalDuration': 1.0,
            'category': 'outdoor',
        },
    ]
    test_prefs = {'preferences': ['food', 'outdoor'], 'priceLevel': 2, 'duration': 1.5}
    test_context = {'hour': 10, 'day_of_week': 2, 'distance_km': 0.5, 'weather': 'clear', 'is_open': True}

    scored = recommender.predict_scores(test_activities, test_prefs, test_context)
    for s in scored:
        print(f"  {s['id']}: ml_score={s['ml_score']:.3f}")

    print("\n[OK] Training complete!")


if __name__ == '__main__':
    main()
