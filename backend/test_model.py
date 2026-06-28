import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.fraud_detection import fraud_detector

test_tx = {
    "step": 1,
    "type": "TRANSFER",
    "amount": 54320,
    "oldbalanceOrg": 54320.5,
    "newbalanceOrig": 0.5,
    "oldbalanceDest": 0,
    "newbalanceDest": 54320
}

print("Running test prediction...")
result = fraud_detector.predict(test_tx)
print("Result:", result)
