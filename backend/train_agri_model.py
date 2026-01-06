import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
import json
import os

# CONFIGURAZIONE 
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
DATASET_DIR = "PlantVillage"  

if not os.path.exists(DATASET_DIR):
    raise FileNotFoundError(f"Errore: La cartella '{DATASET_DIR}' non esiste!")

# 1. GENERATORI DI IMMAGINI ("Addestramento effettuato in modo difficile, in modo da far adattare la rete neurale")

train_datagen = ImageDataGenerator(
    rescale=1./255,
    
    rotation_range=50,              # Ruota molto
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=[0.5, 1.3],          # ZOOM ESTREMO: Dal 50% al 130%. 
                                    
    horizontal_flip=True,
    vertical_flip=True,             # Utile per foto dall'alto (terreni)
    
    brightness_range=[0.6, 1.4],    # Simula ombra scura e sole forte
    channel_shift_range=30.0,       # Simula fotocamere con colori diversi
    
    fill_mode='nearest',
    validation_split=0.3            # 30% delle foto usate per l'esame finale
)

print("Caricamento Dataset...")
# I Dati per lo Studio (70%)
train_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

# I Dati per l'Esame (30%)
val_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

# SALVATAGGIO MAPPA CLASSI
class_map_path = "class_indices.json"
with open(class_map_path, "w") as f:
    json.dump(train_generator.class_indices, f)
print(f"Mappa classi salvata in '{class_map_path}'.")

# 2. ARCHITETTURA (MobileNetV2 Fine-Tuning)
print("Costruzione Modello...")
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

base_model.trainable = True
fine_tune_at = 100 
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

# La "Testa" del modello (Potenziata per gestire il nuovo dataset complesso)
x = base_model.output
x = GlobalAveragePooling2D()(x)

# Primo strato denso potente
x = Dense(1024, activation='relu')(x) 
x = Dropout(0.5)(x)  # Dropout aggressivo (50%) per evitare che impari a memoria

# Secondo strato di rifinitura
x = Dense(512, activation='relu')(x)
x = Dropout(0.3)(x)

predictions = Dense(train_generator.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# 3. COMPILAZIONE
model.compile(optimizer=Adam(learning_rate=1e-5), # Velocità bassa per precisione
              loss='categorical_crossentropy', 
              metrics=['accuracy'])

# Callback
early_stop = EarlyStopping(monitor='val_loss', patience=4, restore_best_weights=True)

# 4. TRAINING
print(f"\nInizio training su {train_generator.num_classes} classi...")
print(f"Immagini di training: {train_generator.samples}")
print(f"Immagini di test: {val_generator.samples}")

history = model.fit(
    train_generator, 
    epochs=15, 
    validation_data=val_generator,
    callbacks=[early_stop]
)

# 5. SALVATAGGIO MODELLO
model_name = "greenfield_agri_brain.h5"
model.save(model_name)
print(f"\nCOMPLETATO! Modello salvato come '{model_name}'")