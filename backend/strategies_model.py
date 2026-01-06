from abc import ABC, abstractmethod
from sklearn.linear_model import LogisticRegression
import numpy as np
import pandas as pd

class ModelStrategy(ABC):
    @abstractmethod
    def train(self, X, y):
        pass

    @abstractmethod
    def predict(self, df, features):
        pass

class LogisticRegressionStrategy(ModelStrategy):
    """ Strategia ML: Richiede training e calcoliamo l'accuratezza. """
    def __init__(self, max_iter=2000):
        self.model = LogisticRegression(max_iter=max_iter)
        self.is_trained = False

    def train(self, X, y):
        self.model.fit(X, y)
        self.is_trained = True

    def predict(self, df, features):
        if not self.is_trained:
            raise ValueError("Modello non addestrato.")
        if set(features).issubset(df.columns):
            X = df[features]
        else:
            X = df 
        return self.model.predict(X)

class RuleBasedStrategy(ModelStrategy):
    """
    Strategia Regole Adattata.
    """
    def __init__(self, 
                 target_name: str,
                 moisture_threshold_pct: float = 60.0,
                 N_threshold_mgkg: float = 50.0,
                 P_threshold_mgkg: float = 30.0,
                 K_threshold_mgkg: float = 100.0,
                 Tmin_threshold_C: float = 15.0,
                 Tmax_threshold_C: float = 30.0):
        
        self.target_name = target_name
        self.m_thr    = moisture_threshold_pct
        self.n_thr    = N_threshold_mgkg
        self.p_thr    = P_threshold_mgkg
        self.k_thr    = K_threshold_mgkg
        self.tmin_thr = Tmin_threshold_C
        self.tmax_thr = Tmax_threshold_C

        self.cols = {
            "moisture": "Soil_moisture_pct",
            "N": "Nitrogen_mg_kg",
            "P": "Phosphorus_mg_kg",
            "K": "Potassium_mg_kg",
            "T": "Temperature_C",
            "Tmin": "Temp_min_C",
            "Tmax": "Temp_max_C"
        }

    def train(self, X, y):
        pass 

    def _get_series(self, df: pd.DataFrame, key: str) -> pd.Series:
        col_name = self.cols.get(key)
        if (key in ['Tmin', 'Tmax']) and (col_name not in df.columns) and ("Temperature_C" in df.columns):
            return df["Temperature_C"]
        
        if col_name in df.columns:
            return df[col_name]
        return None

    def predict(self, df: pd.DataFrame, features=None):
        sm    = self._get_series(df, "moisture")
        N     = self._get_series(df, "N")
        P     = self._get_series(df, "P")
        K     = self._get_series(df, "K")
        Tmin  = self._get_series(df, "Tmin")
        Tmax  = self._get_series(df, "Tmax")

        n_samples = len(df)
        predictions = np.zeros(n_samples, dtype=int)

        if self.target_name == 'Irrigation':
            if sm is not None:
                predictions = (sm < self.m_thr).astype(int).values

        elif self.target_name == 'Fertilization':
            cond_n = (N < self.n_thr) if N is not None else False
            cond_p = (P < self.p_thr) if P is not None else False
            cond_k = (K < self.k_thr) if K is not None else False
            predictions = (cond_n | cond_p | cond_k).astype(int)
            if isinstance(predictions, pd.Series):
                predictions = predictions.values

        elif self.target_name == 'Energy':
            cond_heat = (Tmin < self.tmin_thr) if Tmin is not None else False
            cond_cool = (Tmax > self.tmax_thr) if Tmax is not None else False
            predictions = (cond_heat | cond_cool).astype(int)
            if isinstance(predictions, pd.Series):
                predictions = predictions.values

        return predictions