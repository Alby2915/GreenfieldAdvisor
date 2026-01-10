import pandas as pd
from abc import ABC, abstractmethod

class Observer(ABC):
    @abstractmethod
    def update(self, row: pd.Series):
        pass

class Subject:
    def __init__(self):
        self._observers = []

    def attach(self, observer: Observer):
        self._observers.append(observer)

    def detach(self, observer: Observer):
        self._observers.remove(observer)

    def notify(self, row: pd.Series):
        for obs in self._observers:
            obs.update(row)

class SensorDataSource(Subject):
    """Trasmette le righe di un DataFrame come aggiornamenti di sensori in tempo reale."""
    def stream(self, df: pd.DataFrame, limit: int = 10):
        for i, (_, row) in enumerate(df.iterrows()):
            self.notify(row)
            if i + 1 >= limit:
                break

class AdvisorObserver(Observer):
    """Esegue la pipeline esistente per UNA riga in ingresso e stampa la raccomandazione."""
    def __init__(self, pipeline, target_name: str):
        self.pipeline = pipeline
        self.target_name = target_name
        self.history = []

    def update(self, row: pd.Series):
        df_one = pd.DataFrame([row])          # 1-row dataframe
        result = self.pipeline.handle(df_one) 

        pred_col = f"{self.target_name}_Predicted"
        pred = int(result[pred_col].iloc[0])

        self.history.append(result.iloc[0].to_dict())

        action = "SI" if pred == 1 else "NO"
        print(f"[Observer] {self.target_name} = {action} ({pred})")

    def get_history_df(self):
        return pd.DataFrame(self.history)
