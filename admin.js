// Espace administrateur : création des comptes employeurs et consultation des comptes.
(function () {
  // Empreinte SHA-256 du code d'accès de démonstration « admin1234 ».
  // Ce contrôle se fait dans le navigateur : il ne protège rien tant qu'il n'y a pas de serveur.
  const CODE_ADMIN = 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270';
  const SESSION = 'mds-admin-connecte';

  const connexion = document.getElementById('connexion');
  const espace = document.getElementById('espace');
  const formEmployeur = document.getElementById('form-employeur');
  const msgEmployeur = document.getElementById('msg-employeur');

  function estConnecte() {
    try { return sessionStorage.getItem(SESSION) === 'oui'; } catch { return false; }
  }

  function afficher() {
    const ok = estConnecte();
    connexion.classList.toggle('cache', ok);
    espace.classList.toggle('cache', !ok);
    if (ok) afficherComptes();
  }

  document.getElementById('form-connexion').addEventListener('submit', async e => {
    e.preventDefault();
    const champ = document.getElementById('code');
    if (await MDS.empreinte(champ.value) === CODE_ADMIN) {
      try { sessionStorage.setItem(SESSION, 'oui'); } catch { /* stockage indisponible */ }
      champ.value = '';
      document.getElementById('msg-connexion').textContent = '';
      afficher();
    } else {
      document.getElementById('msg-connexion').textContent = "Code d'accès incorrect.";
    }
  });

  document.getElementById('deconnexion').addEventListener('click', () => {
    try { sessionStorage.removeItem(SESSION); } catch { /* stockage indisponible */ }
    afficher();
  });

  document.querySelectorAll('[data-onglet]').forEach(bouton => {
    bouton.addEventListener('click', () => {
      document.querySelectorAll('[data-onglet]').forEach(b => {
        const actif = b === bouton;
        b.setAttribute('aria-selected', actif);
        document.getElementById('onglet-' + b.dataset.onglet).classList.toggle('cache', !actif);
      });
      if (bouton.dataset.onglet === 'comptes') afficherComptes();
    });
  });

  function verifier(d) {
    if (d.entreprise.length < 2) return "Indiquez le nom de l'entreprise.";
    if (!d.secteur) return "Choisissez un secteur d'activité.";
    if (d.responsable.length < 2) return 'Indiquez le nom du responsable.';
    if (!MDS.EMAIL_VALIDE.test(d.email)) return "L'adresse e-mail n'est pas valide.";
    if (MDS.emailDejaUtilise(d.email)) return 'Un compte (candidat ou employeur) existe déjà avec cette adresse.';
    if (!MDS.telephoneValide(d.telephone)) return 'Le numéro doit contenir entre 8 et 15 chiffres.';
    if (d.ville.length < 2) return 'Indiquez la ville.';
    if (!MDS.motDePasseValide(d.motDePasse)) return 'Le mot de passe doit faire au moins 8 caractères avec une lettre et un chiffre.';
    return null;
  }

  formEmployeur.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries([...new FormData(formEmployeur)].map(([k, v]) => [k, v.trim()]));
    const erreur = verifier(d);
    msgEmployeur.className = 'message ' + (erreur ? 'erreur' : 'succes');
    if (erreur) { msgEmployeur.textContent = erreur; return; }

    MDS.ajouter('employeurs', {
      type: 'employeur',
      entreprise: d.entreprise,
      secteur: d.secteur,
      responsable: d.responsable,
      email: d.email.toLowerCase(),
      telephone: d.telephone,
      ville: d.ville,
      motDePasse: await MDS.empreinte(d.motDePasse),
      creeLe: new Date().toISOString(),
      creePar: 'admin'
    });
    msgEmployeur.textContent = `Le compte employeur « ${d.entreprise} » a été créé. ` +
      `Communiquez à ${d.responsable} son identifiant (${d.email.toLowerCase()}) et son mot de passe provisoire.`;
    formEmployeur.reset();
  });

  function tableau(conteneur, lignes, colonnes) {
    conteneur.innerHTML = '';
    if (!lignes.length) {
      const p = document.createElement('p');
      p.className = 'vide';
      p.textContent = 'Aucun compte pour le moment.';
      conteneur.appendChild(p);
      return;
    }
    const table = document.createElement('table');
    const entete = table.createTHead().insertRow();
    colonnes.forEach(([titre]) => {
      const th = document.createElement('th');
      th.textContent = titre;
      entete.appendChild(th);
    });
    const corps = table.createTBody();
    lignes.forEach(l => {
      const ligne = corps.insertRow();
      colonnes.forEach(([, valeur]) => { ligne.insertCell().textContent = valeur(l); });
    });
    conteneur.appendChild(table);
  }

  const date = iso => new Date(iso).toLocaleDateString('fr-FR');

  function afficherComptes() {
    tableau(document.getElementById('liste-employeurs'), MDS.lire('employeurs'), [
      ['Entreprise', e => e.entreprise],
      ['Secteur', e => e.secteur],
      ['Responsable', e => e.responsable],
      ['E-mail', e => e.email],
      ['Téléphone', e => e.telephone],
      ['Ville', e => e.ville],
      ['Créé le', e => date(e.creeLe)]
    ]);
    tableau(document.getElementById('liste-candidats'), MDS.lire('candidats'), [
      ['Nom', c => `${c.prenom} ${c.nom}`],
      ['E-mail', c => c.email],
      ['Téléphone', c => c.telephone],
      ['Créé le', c => date(c.creeLe)]
    ]);
  }

  afficher();
})();
