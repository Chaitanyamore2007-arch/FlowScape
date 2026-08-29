import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

print("Step 1: Generating realistic ASI/Tourism synthetic dataset...")
np.random.seed(42)
n_samples = 1500

time_of_day = np.random.randint(8, 20, n_samples) # ASI monuments open 8 AM - 8 PM
day_of_week = np.random.randint(0, 7, n_samples) # 0=Mon, 6=Sun
is_holiday = np.random.choice([0, 1], p=[0.9, 0.1], size=n_samples)
weather_temp = np.random.randint(15, 45, n_samples)

density = []
for i in range(n_samples):
    score = 0
    if day_of_week[i] >= 5: score += 40
    if is_holiday[i]: score += 50
    if 11 <= time_of_day[i] <= 16: score += 30
    if weather_temp[i] > 38: score -= 20
    score += np.random.normal(0, 15)
    
    if score > 80:
        density.append("RED")
    elif score > 45:
        density.append("YELLOW")
    else:
        density.append("GREEN")

df = pd.DataFrame({
    'time_of_day': time_of_day,
    'day_of_week': day_of_week,
    'is_holiday': is_holiday,
    'weather_temp': weather_temp,
    'density_status': density
})
df.to_csv("asi_tourism_data.csv", index=False)
print("Saved to asi_tourism_data.csv")

print("Step 2: Training Scikit-Learn Random Forest Classifier...")
X = df[['time_of_day', 'day_of_week', 'is_holiday', 'weather_temp']]
y = df['density_status']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
model.fit(X_train, y_train)

accuracy = accuracy_score(y_test, y_pred=model.predict(X_test))
print(f"==> Model Accuracy: {accuracy * 100:.2f}%")

joblib.dump(model, "density_model.joblib")
print("Saved density_model.joblib to disk for the FastAPI backend!")
