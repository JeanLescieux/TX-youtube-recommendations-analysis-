import json
import os
import re
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.pipeline import Pipeline
from nltk.corpus import stopwords
import nltk

# Télécharger les ressources NLTK nécessaires
nltk.download('punkt')
nltk.download('stopwords')

# Charger les données depuis un fichier JSON
def load_data(directory):
    all_texts = []
    all_labels = []
    label_mapping = {"gauche": 0, "droite": 1, "extrême-droite": 2}

    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as file:
                data = json.load(file)
                all_texts.append(preprocess_texts(data['transcript']))
                all_labels.append(label_mapping[data['label']])
    
    return all_texts, all_labels

# Nettoyer le texte
def clean_text(text):
    text = re.sub(r'[^\w\s]', '', text)  # Enlever la ponctuation
    text = text.lower().strip()  # Convertir en minuscules
    return text

# Tokenisation et suppression des stopwords
def preprocess_texts(transcript):
    stop_words = set(stopwords.words('french'))
    processed_texts = []

    for entry in transcript:
        text = clean_text(entry['text'])
        tokens = word_tokenize(text)
        filtered_tokens = [token for token in tokens if token not in stop_words]
        processed_texts.append(' '.join(filtered_tokens))
    
    return ' '.join(processed_texts)

# Fonction pour évaluer plusieurs modèles de classification
def test_classifiers(X_train, X_test, y_train, y_test):
    classifiers = {
        "Naive Bayes": MultinomialNB(),
        "Logistic Regression": LogisticRegression(max_iter=1000),
        "SVM": SVC(),
        "Random Forest": RandomForestClassifier(),
        "K-Nearest Neighbors": KNeighborsClassifier(),
        "Decision Tree": DecisionTreeClassifier()
    }
    
    results = {}
    for name, model in classifiers.items():
        clf = Pipeline([('tfidf', TfidfVectorizer()), ('classifier', model)])
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        results[name] = accuracy
        print(f"{name} Accuracy: {accuracy * 100:.2f}%")
    
    return results

# Fonction principale
if __name__ == "__main__":
    directory = 'politics'  # Répertoire contenant les fichiers JSON

    # Charger et prétraiter les fichiers JSON
    all_texts, all_labels = load_data(directory)

    # Diviser les données en ensembles d'entraînement et de test (80/20)
    X_train, X_test, y_train, y_test = train_test_split(all_texts, all_labels, test_size=0.15, random_state=42)

    # Tester plusieurs classificateurs
    test_classifiers(X_train, X_test, y_train, y_test)
