import os
import psutil
from sentence_transformers import SentenceTransformer

p = psutil.Process(os.getpid())

print(f"before:      {p.memory_info().rss // 1024**2} MB")

model = SentenceTransformer("BAAI/bge-small-en-v1.5")
print(f"after load:  {p.memory_info().rss // 1024**2} MB")

model.encode(["warmup query"])
print(f"after encode: {p.memory_info().rss // 1024**2} MB")

for _ in range(20):
    model.encode(["How do I create a PaymentIntent with metadata?"])
print(f"after 20x:   {p.memory_info().rss // 1024**2} MB")
