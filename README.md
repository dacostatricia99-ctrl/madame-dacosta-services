# Madame Dacosta Services

Deux espaces :

- **Espace candidat** (`index.html`)
- **Tableau de bord administrateur** (`admin.html`)

## Espace candidat

**Awa**, une conseillère virtuelle, aide les candidats à créer leur compte étape par étape :

1. Prénom et nom
2. Adresse e-mail (vérifie le format et les doublons)
3. Téléphone
4. Mot de passe + confirmation
5. Récapitulatif, puis création du compte

Le client peut revenir en arrière à tout moment et chaque erreur est expliquée simplement.

## Tableau de bord administrateur

Accessible via le lien « Tableau de bord (admin) » en haut de la page d'accueil. On s'y connecte avec une adresse e-mail administrateur ; à la première connexion, l'admin choisit son mot de passe.

Les adresses admin sont listées dans `admin.js` (constante `ADMINS`) sous forme d'empreinte SHA-256, pour ne pas les publier en clair. Pour en ajouter une :

```sh
echo -n "adresse@exemple.fr" | sha256sum
```

- **Statistiques** : nombre d'employeurs, de candidats et de nouveaux comptes sur 7 jours.
- **Créer un employeur** : entreprise, secteur, responsable, e-mail, téléphone, ville et mot de passe provisoire à transmettre à l'employeur.
- **Voir les comptes** : liste des employeurs et des candidats.

Une même adresse e-mail ne peut servir qu'à un seul compte, candidat ou employeur.

## Lancer le site

Ouvrez `index.html` dans un navigateur, ou servez le dossier :

```sh
python3 -m http.server 8000
```

puis allez sur http://localhost:8000.

> Démonstration : les comptes sont enregistrés dans le navigateur (`localStorage`), mot de passe haché en SHA-256. La connexion administrateur est vérifiée dans le navigateur, il ne protège donc rien réellement. Pour un vrai service, il faudra un serveur et une base de données.
