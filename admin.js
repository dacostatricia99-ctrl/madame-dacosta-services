// Tableau de bord administrateur : création des comptes employeurs et consultation des comptes.
(function () {
  // Empreintes SHA-256 (en minuscules) des adresses e-mail administrateur, pour ne pas les publier en clair.
  // Pour ajouter un admin : echo -n "adresse@exemple.fr" | sha256sum
  // Ce contrôle se fait dans le navigateur : il ne protège rien tant qu'il n'y a pas de serveur.
  const ADMINS = [
    '84e19b65e4d5cc081577bad931e7f86d4295c2f90b282af64b9138dea06e0011'
  ];
  const MOTS_DE_PASSE = 'mds-admins';
  const SESSION = 'mds-admin-connecte';

  const connexion = document.getElementById('connexion');
  const espace = document.getElementById('espace');
  const formEmployeur = document.getElementById('form-employeur');
  const msgEmployeur = document.getElementById('msg-employeur');

  function adminConnecte() {
    try { return sessionStorage.getItem(SESSION); } catch { return null; }
  }

  function lireMotsDePasse() {
    try { return JSON.parse(localStorage.getItem(MOTS_DE_PASSE)) || {}; } catch { return {}; }
  }

  function afficher() {
    const email = adminConnecte();
    connexion.classList.toggle('cache', !!email);
    espace.classList.toggle('cache', !email);
    if (email) {
      document.getElementById('admin-connecte').textContent = email;
      afficherComptes();
    }
  }

  const champEmail = document.getElementById('email-admin');
  const champMdp = document.getElementById('mdp-admin');
  const champConfirmation = document.getElementById('mdp-confirmation');
  const msgConnexion = document.getElementById('msg-connexion');

  // À la première connexion d'un admin, on lui fait choisir son mot de passe.
  async function premiereConnexion(email) {
    const cle = await MDS.empreinte(email);
    return ADMINS.includes(cle) && !lireMotsDePasse()[cle];
  }

  async function adapterFormulaire() {
    msgConnexion.textContent = '';
    const premiere = await premiereConnexion(champEmail.value.trim().toLowerCase());
    document.getElementById('bloc-confirmation').classList.toggle('cache', !premiere);
    document.getElementById('aide-connexion').classList.toggle('cache', !premiere);
    champConfirmation.required = premiere;
    champMdp.autocomplete = premiere ? 'new-password' : 'current-password';
    document.getElementById('bouton-connexion').textContent = premiere ? 'Créer mon mot de passe' : 'Se connecter';
  }
  champEmail.addEventListener('change', adapterFormulaire);

  document.getElementById('form-connexion').addEventListener('submit', async e => {
    e.preventDefault();
    const email = champEmail.value.trim().toLowerCase();
    const cle = await MDS.empreinte(email);
    if (!ADMINS.includes(cle)) {
      msgConnexion.textContent = "Cette adresse n'a pas d'accès administrateur.";
      return;
    }
    const motsDePasse = lireMotsDePasse();
    const empreinteMdp = await MDS.empreinte(champMdp.value);
    if (!motsDePasse[cle]) {
      if (!MDS.motDePasseValide(champMdp.value)) {
        msgConnexion.textContent = 'Le mot de passe doit faire au moins 8 caractères avec une lettre et un chiffre.';
        return;
      }
      if (!champConfirmation.value) {
        await adapterFormulaire();
        msgConnexion.textContent = 'Première connexion : confirmez votre mot de passe.';
        return;
      }
      if (champMdp.value !== champConfirmation.value) {
        msgConnexion.textContent = 'Les deux mots de passe ne correspondent pas.';
        return;
      }
      motsDePasse[cle] = empreinteMdp;
      try { localStorage.setItem(MOTS_DE_PASSE, JSON.stringify(motsDePasse)); } catch { /* stockage indisponible */ }
    } else if (motsDePasse[cle] !== empreinteMdp) {
      msgConnexion.textContent = 'Mot de passe incorrect.';
      return;
    }
    try { sessionStorage.setItem(SESSION, email); } catch { /* stockage indisponible */ }
    e.target.reset();
    msgConnexion.textContent = '';
    afficher();
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
      creePar: adminConnecte()
    });
    msgEmployeur.textContent = `Le compte employeur « ${d.entreprise} » a été créé. ` +
      `Communiquez à ${d.responsable} son identifiant (${d.email.toLowerCase()}) et son mot de passe provisoire.`;
    formEmployeur.reset();
    afficherComptes();
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
    const employeurs = MDS.lire('employeurs');
    const candidats = MDS.lire('candidats');
    const ilYaSeptJours = Date.now() - 7 * 24 * 3600 * 1000;
    document.getElementById('nb-employeurs').textContent = employeurs.length;
    document.getElementById('nb-candidats').textContent = candidats.length;
    document.getElementById('nb-semaine').textContent =
      [...employeurs, ...candidats].filter(c => new Date(c.creeLe) >= ilYaSeptJours).length;

    tableau(document.getElementById('liste-employeurs'), employeurs, [
      ['Entreprise', e => e.entreprise],
      ['Secteur', e => e.secteur],
      ['Responsable', e => e.responsable],
      ['E-mail', e => e.email],
      ['Téléphone', e => e.telephone],
      ['Ville', e => e.ville],
      ['Créé le', e => date(e.creeLe)]
    ]);
    tableau(document.getElementById('liste-candidats'), candidats, [
      ['Nom', c => `${c.prenom} ${c.nom}`],
      ['E-mail', c => c.email],
      ['Téléphone', c => c.telephone],
      ['Créé le', c => date(c.creeLe)]
    ]);
  }

  afficher();
})();
