import openai
import json
import os

# Set via environment variable or default to simple logic if missing
openai.api_key = os.getenv("OPENAI_API_KEY", "")

def llm_suggest_fix(record):
    """
    Mock LLM behavior if no API key is present to avoid crashing.
    Real implementation uses OpenAI if key exists.
    """
    if not openai.api_key or openai.api_key == "":
        # Mock Response for demo purposes if no key
        return {
            "domain": {"suggested": record.get("domain", ""), "confidence": 0.5},
            "industry": {"suggested": "Unknown", "confidence": 0.5},
            "role_function": {"suggested": "Other", "confidence": 0.5}
        }

    try:
        prompt = f"""
        You are a data quality assistant.
        Given this B2B record, suggest corrections and normalization.
        Return JSON only with keys: domain (object with suggested, confidence), industry (object with suggested, confidence), role_function (object with suggested, confidence).
        
        Record:
        {record}
        """

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"LLM Error: {e}")
        return {
            "domain": {"suggested": record.get("domain", ""), "confidence": 0.0},
            "industry": {"suggested": "Unknown", "confidence": 0.0},
            "role_function": {"suggested": "Other", "confidence": 0.0}
        }
