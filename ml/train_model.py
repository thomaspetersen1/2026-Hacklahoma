import sys
sys.path.append('src')

from models.RFC import RandomForestRecommender
from utils.generate_training_data import generate_synthetic_data

def main():
    print("🔥 Training Random Forest Recommender...")
    
    # Generate synthetic training data
    print("📊 Generating synthetic training data...")
    training_data = generate_synthetic_data(n_samples=2000)
    
    print(f"✓ Generated {len(training_data)} samples")
    positive_samples = sum(1 for s in training_data if s['label'] == 1)
    print(f"  Positive samples: {positive_samples}")
    print(f"  Negative samples: {len(training_data) - positive_samples}")
    
    # Train model
    recommender = RandomForestRecommender()
    recommender.train(training_data)
    
    # Save model
    recommender.save_model()
    
    print("\n✅ Training complete!")

if __name__ == '__main__':
    main()