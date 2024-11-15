import json
import networkx as nx
import matplotlib.pyplot as plt

# Fonction pour charger le fichier JSON
def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as file:
        return json.load(file)

# Fonction pour créer le graphe à partir des données
def create_graph(data):
    G = nx.DiGraph()

    # Crée un dictionnaire pour les couleurs des nœuds (vert pour les vidéos visionnées, rouge pour les recommandées)
    node_colors = {}

    # Crée un dictionnaire pour stocker les titres des vidéos associées à leurs URLs
    video_titles = {}

    # Ajoute les vidéos dans le graphe
    for video in data['watchedVideos']:
        video_url = video['videoURL']
        video_titles[video_url] = video['title']  # Associe chaque URL à son titre
        
        # Déterminer la couleur du nœud
        if video['views'] is not None:
            node_colors[video_url] = 'green'  # Nœud vert pour les vidéos visionnées
        else:
            node_colors[video_url] = 'red'  # Nœud rouge pour les vidéos recommandées

        # Ajouter le nœud au graphe avec un attribut 'title'
        G.add_node(video_url, title=video['title'])

        # Ajouter des arêtes basées sur les recommandations
        for recommended in video['recommendedFrom']:
            recommended_url = recommended['videoURL']
            G.add_edge(recommended_url, video_url)

    return G, node_colors, video_titles

# Fonction pour afficher le graphe
def plot_graph(G, node_colors, video_titles):
    node_color_list = []
    for node in G.nodes():
        # Si la clé du nœud existe dans node_colors, on prend la couleur, sinon on met une couleur par défaut
        node_color_list.append(node_colors.get(node, 'gray'))  # 'gray' comme couleur par défaut
    plt.figure(figsize=(12, 12))  # Augmente la taille de la figure pour plus d'espace
    pos = nx.spring_layout(G, k=0.3, iterations=30)  # Ajuste la disposition du graphe

    # Dessine les nœuds
    nx.draw_networkx_nodes(G, pos, node_size=500, node_color=[node_colors[node] for node in G.nodes()])
    
    # Dessine les arêtes
    nx.draw_networkx_edges(G, pos, edgelist=G.edges(), edge_color='gray', alpha=0.5)

    # Dessine les étiquettes des nœuds en utilisant les titres des vidéos
    nx.draw_networkx_labels(G, pos, labels=video_titles, font_size=8, font_color='black', font_weight='bold')

    # Affiche le graphe
    plt.axis('off')  # Retirer les axes pour une meilleure visibilité
    plt.show()

# Fonction principale
def main(json_filepath):
    data = load_json(json_filepath)  # Charger le JSON
    G, node_colors, video_titles = create_graph(data)  # Créer le graphe
    plot_graph(G, node_colors, video_titles)  # Afficher le graphe

# Point d'entrée du script
if __name__ == "__main__":
    # Spécifie le chemin du fichier JSON
    json_filepath = "graph/extract_tx_5.json"  # Remplace par le bon chemin si nécessaire
    main(json_filepath)
