import pandas as pd
import os

def load_dataset_robust(filepath):
    encodings = ['utf-8', 'latin-1', 'cp1252']
    separators = [';', ',']
    for enc in encodings:
        for sep in separators:
            try:
                preview = pd.read_csv(filepath, sep=sep, encoding=enc, nrows=2)
                if preview.shape[1] > 1:
                    print(f"Caricato {os.path.basename(filepath)} con encoding={enc}, sep='{sep}'")
                    return pd.read_csv(filepath, sep=sep, encoding=enc)
            except Exception:
                continue
    raise ValueError(f"Impossibile leggere {filepath}")