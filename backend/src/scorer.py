def calculate_quality_score(total, issues):
    if total == 0:
        return 100.0
    clean_ratio = (total - issues) / total
    # Ensure score doesn't go below 0
    clean_ratio = max(0, clean_ratio)
    return round(clean_ratio * 100, 2)
