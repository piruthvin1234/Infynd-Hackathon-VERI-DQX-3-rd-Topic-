import requests
import json

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "llama3"   # or llama3:8b / mistral / qwen2.5

def classify_job_titles(job_titles):
    """
    Classifies a list of job titles into standard job functions using a local Ollama model.
    Returns a list of dicts:
    { "job_function": "Engineering", "job_titles": [...], "count": n }
    """

    unique_titles = list(set([t for t in job_titles if t and str(t).strip()]))

    prompt = f"""
You are an AI Job Classifier.

Classify the following job titles into these standard categories:
[Engineering, Management, Sales, R&D, Marketing, Accounting/Finance, Business Development,
Legal, Education, Medical/Health, Production/Manufacturing, Admin, Operations, HR,
Customer Service, IT, Design, Other]

Rules:
- "SDE", "Software Developer" → Engineering
- "Director of Sales" → Sales
- "Civil Engineering Consultant" → Engineering
- Be precise.
- Output ONLY valid JSON.

Input Titles:
{json.dumps(unique_titles)}

Return output in this exact format:
{{
  "mappings": [
    {{ "title": "Job Title", "function": "Category" }}
  ]
}}
"""

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": "You are a precise job classification assistant. Output ONLY JSON."},
            {"role": "user", "content": prompt}
        ],
        "stream": False,
        "options": {
            "temperature": 0
        }
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()

        result = response.json()
        content = result["message"]["content"]

        parsed = json.loads(content)
        mappings = parsed.get("mappings", [])

        # Group by job function
        grouped = {}
        for m in mappings:
            func = m.get("function", "Other")
            title = m.get("title")
            grouped.setdefault(func, []).append(title)

        output_summary = []
        for func, titles in grouped.items():
            output_summary.append({
                "job_function": func,
                "job_titles": titles,
                "count": len(titles)
            })

        return output_summary

    except Exception as e:
        print(f"Ollama Error: {e}")
        return [{
            "job_function": "Unclassified",
            "job_titles": unique_titles,
            "count": len(unique_titles)
        }]
