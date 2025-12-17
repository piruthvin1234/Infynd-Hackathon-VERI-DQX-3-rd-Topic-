from rapidfuzz import fuzz

def is_duplicate(name1, name2):
    if not isinstance(name1, str) or not isinstance(name2, str):
        return False, 0.0
    score = fuzz.token_sort_ratio(name1, name2)
    return score > 85, score / 100
