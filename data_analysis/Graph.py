import json
import joblib
from pyvis.network import Network
import re

# Fonction pour nettoyer les nombres de vues et les convertir en entiers
def clean_views(view_count):
    if isinstance(view_count, str):
        view_count = re.sub(r"[^\d]", "", view_count)  # Enlever tout sauf les chiffres
        return int(view_count) if view_count.isdigit() else 0
    return 0

# Classifier une vidéo avec le modèle
def classify_video(video_url, model):
    categories = ["sport", "makeup", "jeuxvideos", "politique", "tech", "entertainment",
                  "vlog", "actualites", "cuisine", "education", "automobile"]
    return categories[hash(video_url) % len(categories)]  # Classification fictive

# Construire un graphe des vidéos avec PyVis
def build_interactive_graph(data, model, output_file="videos_graph.html"):
    # Créer le graphe interactif
    net = Network(height="800px", width="100%", bgcolor="#222222", font_color="white", directed=True)
    net.barnes_hut(gravity=-8000, spring_length=100)  # Ajuster la disposition du graphe

    # Définir des couleurs pour les catégories
    color_mapping = {
        "sport": "#1f78b4",
        "makeup": "#ff69b4",
        "jeuxvideos": "#33a02c",
        "politique": "#e31a1c",
        "tech": "#ff7f00",
        "entertainment": "#6a3d9a",
        "vlog": "#ffff99",
        "actualites": "#a6cee3",
        "cuisine": "#b15928",
        "education": "#b2df8a",
        "automobile": "#7f7f7f"
    }

    # Garder une trace des nœuds déjà ajoutés pour éviter les duplications
    existing_nodes = set()

    # Ajouter les nœuds et les arêtes
    for video in data["watchedVideos"]:
        video_id = video["videoURL"].split("v=")[-1]
        views = clean_views(video.get("views", "0"))
        video_type = classify_video(video["videoURL"], model)

        # Ajouter le nœud principal
        if video_id not in existing_nodes:
            net.add_node(
                video_id,
                label=video["title"],
                title=f"<b>{video['title']}</b><br>Type : {video_type.capitalize()}<br>Vues : {views}",
                size=max(20, views / 5000),  # Taille minimale pour éviter les nœuds trop gros
                color=color_mapping.get(video_type, "#ffffff"),
                shape="dot",
                url=video["videoURL"]  # Redirection vers la vidéo
            )
            existing_nodes.add(video_id)

        # Ajouter les recommandations
        for rec in video.get("recommendations", []):
            rec_id = rec["videoURL"].split("v=")[-1]
            rec_type = classify_video(rec["videoURL"], model)

            # Ajouter le nœud de recommandation s'il n'est pas déjà ajouté
            if rec_id not in existing_nodes:
                net.add_node(
                    rec_id,
                    label=rec["title"],
                    title=f"<b>{rec['title']}</b><br>Type : {rec_type.capitalize()}",
                    size=10,  # Taille fixe pour les recommandations
                    color=color_mapping.get(rec_type, "#cccccc"),
                    shape="dot",
                    url=rec["videoURL"]
                )
                existing_nodes.add(rec_id)

            # Ajouter une arête entre la vidéo principale et la recommandation
            net.add_edge(video_id, rec_id, color="#aaaaaa", width=1, arrowStrikethrough=False)

    # Vérification et écriture du fichier HTML
    try:
        net.write_html(output_file)
        print(f"Graphe généré : {output_file}")
    except Exception as e:
        print(f"Erreur lors de la génération du graphe : {e}")

# Exemple d'utilisation
if __name__ == "__main__":
    json_file = "datav2.json"  # Chemin vers le fichier JSON
    model_path = "best_videotype_model.joblib"  # Chemin vers le modèle sauvegardé

    # Charger le fichier JSON avec un encodage explicite
    with open(json_file, "r", encoding="utf-8") as file:
        data = json.load(file)

    # Charger le modèle
    model = joblib.load(model_path)

    # Construire et afficher le graphe interactif
    build_interactive_graph(data, model, output_file="videos_graph2.html")
