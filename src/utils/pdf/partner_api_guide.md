# PlantSaathiAI Partner API Guide

Welcome to the PlantSaathiAI API! This guide will help you use your API key to access our plant disease prediction endpoint.

---

## 1. Your API Key

You will receive an API key from us. Keep it secure and do not share it publicly.

---

## 2. API Endpoint

**Prediction Endpoint:**
```
POST https://yourdomain.com/predict
```
(For testing, you can use: `http://127.0.0.1:8001/predict`)

---

## 3. Making a Prediction Request (Python Example)

```python
import requests

API_URL = "https://yourdomain.com/predict"  # Or local URL for testing
API_KEY = "<your-api-key-here>"
image_path = "leaf.jpg"  # Path to your image file

headers = {
    "x-api-key": API_KEY
}
files = {
    "file": open(image_path, "rb")
}

response = requests.post(API_URL, headers=headers, files=files)

if response.status_code == 200:
    print("Prediction result:")
    print(response.json())
else:
    print("Error:", response.status_code, response.text)
```

---

## 4. Making a Prediction Request (JavaScript Example)

```js
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('https://yourdomain.com/predict', {
  method: 'POST',
  headers: {
    'x-api-key': '<your-api-key-here>'
  },
  body: formData
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 5. Expected Response

A successful prediction returns a JSON object like:

```json
{
  "disease": "Leaf Spot",
  "confidence": 0.91,
  "severity": "High",
  "stage": "Vegetative",
  "yield_impact": "30-50%",
  "spread_risk": "High",
  "recovery": "Medium",
  "symptoms": [
    "Brown circular spots",
    "Yellowing margins"
  ],
  "action_plan": {
    "immediate": "Remove infected parts.",
    "short_term": "Apply fungicide spray every 5–7 days."
  },
  "treatments": {
    "organic": "Garlic extract spray (50ml/L)",
    "chemical": "Chlorothalonil 2g/L"
  }
}
```

---

## 6. Support

If you have any questions or issues, contact our support team at support@plantsaathiai.com.

---

**Thank you for partnering with PlantSaathiAI!** 