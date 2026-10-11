# Madame Dacosta Services

Site d'accueil des clients avec **Awa**, une conseillère virtuelle qui aide les clients à créer leur compte étape par étape :

1. Prénom et nom
2. Adresse e-mail (vérifie le format et les doublons)
3. Téléphone
4. Mot de passe + confirmation
5. Récapitulatif, puis création du compte

Le client peut revenir en arrière à tout moment et chaque erreur est expliquée simplement.

## Lancer le site

Ouvrez `index.html` dans un navigateur, ou servez le dossier :

```sh
python3 -m http.server 8000
```

puis allez sur http://localhost:8000.

> Démonstration : les comptes sont enregistrés dans le navigateur (`localStorage`), mot de passe haché en SHA-256. Pour un vrai service, il faudra un serveur et une base de données.
