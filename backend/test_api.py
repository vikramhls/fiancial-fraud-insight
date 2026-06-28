import requests

payload = {
    "user_id": "USR-12345",
    "amount": 54320,
    "country": "US",
    "transaction_type": "TRANSFER",
    "old_balance_org": 54320.5,
    "new_balance_org": 0.5,
    "old_balance_dest": 0,
    "new_balance_dest": 54320
}

response = requests.post("http://127.0.0.1:8000/api/transactions", json=payload)
print(response.json())
