
import pickle

pkl_path = "../model/best/data.pkl"

with open(pkl_path, 'rb') as f:
    data = pickle.load(f)

print("Type of data:", type(data))
print("Data content:", data)
