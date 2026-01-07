# unify_job_titles.py
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering

# ---------------- CONFIG ----------------
INPUT_FILE = r"D:\VETRI-DQX-main\People_Issues(People_Issues).xlsx"
OUTPUT_FILE = r"D:\VETRI-DQX-main\People_Issues_unified.xlsx"
COLUMN_NAME = "jobtitle"
NUM_CLUSTERS = 50  # adjust based on granularity
# ----------------------------------------

# Load Excel
df = pd.read_excel(INPUT_FILE, dtype=str)
titles = df[COLUMN_NAME].dropna().unique()
print(f"✅ Total unique job titles: {len(titles)}\n")

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Create embeddings
embeddings = model.encode(titles, convert_to_tensor=False)

# Cluster similar titles
clustering = AgglomerativeClustering(n_clusters=NUM_CLUSTERS)
labels = clustering.fit_predict(embeddings)

# Map each title to cluster representative
unified_titles = {}
print("💡 Job title mapping:\n")
for label in set(labels):
    cluster_titles = [t for t, l in zip(titles, labels) if l == label]
    representative = cluster_titles[0]  # pick first title as unified name
    for t in cluster_titles:
        unified_titles[t] = representative
    # Print cluster mapping in terminal
    print(f"{', '.join(cluster_titles)} -> {representative}")

# Apply mapping to original DataFrame
df['jobtitle_unified'] = df[COLUMN_NAME].map(unified_titles)

# Save unified titles to Excel
df.to_excel(OUTPUT_FILE, index=False)
print(f"\n✅ Unified job titles saved to {OUTPUT_FILE}")
