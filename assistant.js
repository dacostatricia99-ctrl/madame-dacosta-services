// Awa, conseillère virtuelle : guide le candidat étape par étape pour créer son compte.
(function () {
  const etapes = [
    {
      champ: 'prenom',
      question: 'Pour commencer, quel est votre prénom ?',
      type: 'text', autocomplete: 'given-name',
      valider: v => v.length >= 2 || 'Votre prénom doit contenir au moins 2 lettres.'
    },
    {
      champ: 'nom',
      question: c => `Enchantée ${c.prenom} ! Quel est votre nom de famille ?`,
      type: 'text', autocomplete: 'family-name',
      valider: v => v.length >= 2 || 'Votre nom doit contenir au moins 2 lettres.'
    },
    {
      champ: 'email',
      question: 'Quelle est votre adresse e-mail ? Elle vous servira à vous connecter.',
      type: 'email', autocomplete: 'email',
      valider: v => {
        if (!MDS.EMAIL_VALIDE.test(v)) return 'Cette adresse ne semble pas valide. Exemple : marie.dupont@gmail.com';
        if (MDS.emailDejaUtilise(v)) return 'Un compte existe déjà avec cette adresse. Essayez une autre adresse.';
        return true;
      },
      normaliser: v => v.toLowerCase()
    },
    {
      champ: 'telephone',
      question: 'Votre numéro de téléphone, pour que nous puissions vous joindre ?',
      type: 'tel', autocomplete: 'tel',
      valider: v => MDS.telephoneValide(v) || 'Le numéro doit contenir entre 8 et 15 chiffres.'
    },
    {
      champ: 'motDePasse',
      question: 'Choisissez un mot de passe : au moins 8 caractères, avec une lettre et un chiffre.',
      type: 'password', autocomplete: 'new-password', masque: true,
      valider: v => MDS.motDePasseValide(v) ||
        'Le mot de passe doit faire au moins 8 caractères et contenir une lettre et un chiffre.'
    },
    {
      champ: 'confirmation',
      question: 'Merci de retaper votre mot de passe pour le confirmer.',
      type: 'password', autocomplete: 'new-password', masque: true,
      valider: (v, c) => v === c.motDePasse || 'Les deux mots de passe ne correspondent pas. Réessayez.'
    }
  ];

  const conversation = document.getElementById('conversation');
  const formulaire = document.getElementById('saisie');
  const champ = document.getElementById('reponse');
  const actions = document.getElementById('actions');

  let client = {};
  let index = 0;

  function dire(texte, auteur = 'employe', erreur = false) {
    const bulle = document.createElement('div');
    bulle.className = `bulle ${auteur}-msg` + (erreur ? ' erreur' : '');
    bulle.textContent = texte;
    conversation.appendChild(bulle);
    conversation.scrollTop = conversation.scrollHeight;
  }

  function bouton(libelle, action, secondaire = false) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = libelle;
    if (secondaire) b.className = 'secondaire';
    b.addEventListener('click', action);
    actions.appendChild(b);
  }

  function poserQuestion() {
    const etape = etapes[index];
    const q = typeof etape.question === 'function' ? etape.question(client) : etape.question;
    dire(q);
    champ.type = etape.type;
    champ.autocomplete = etape.autocomplete;
    champ.value = '';
    champ.focus();
    actions.innerHTML = '';
    if (index > 0) bouton('← Revenir en arrière', retour, true);
  }

  function retour() {
    index--;
    dire("D'accord, reprenons cette étape.");
    poserQuestion();
  }

  formulaire.addEventListener('submit', e => {
    e.preventDefault();
    const etape = etapes[index];
    const brut = champ.value.trim();
    dire(etape.masque ? '•'.repeat(brut.length) : brut, 'client');

    const resultat = etape.valider(brut, client);
    if (resultat !== true) {
      dire(resultat, 'employe', true);
      champ.value = '';
      champ.focus();
      return;
    }
    client[etape.champ] = etape.normaliser ? etape.normaliser(brut) : brut;
    index++;
    if (index < etapes.length) poserQuestion();
    else recapitulatif();
  });

  function recapitulatif() {
    formulaire.classList.add('cache');
    actions.innerHTML = '';
    dire(`Parfait ! Voici le récapitulatif :\n` +
      `• Nom : ${client.prenom} ${client.nom}\n` +
      `• E-mail : ${client.email}\n` +
      `• Téléphone : ${client.telephone}\n\n` +
      `Tout est correct ?`);
    bouton('Oui, créer mon compte', creerCompte);
    bouton('Corriger', recommencer, true);
  }

  async function creerCompte() {
    actions.innerHTML = '';
    MDS.ajouter('candidats', {
      type: 'candidat',
      prenom: client.prenom,
      nom: client.nom,
      email: client.email,
      telephone: client.telephone,
      motDePasse: await MDS.empreinte(client.motDePasse),
      creeLe: new Date().toISOString()
    });
    dire(`Votre compte est créé, ${client.prenom} ! 🎉\nVous pouvez maintenant vous connecter avec ${client.email}.\nN'hésitez pas si vous avez besoin d'autre chose.`);
    bouton('Aider une autre personne', recommencer, true);
  }

  function recommencer() {
    client = {};
    index = 0;
    formulaire.classList.remove('cache');
    dire('Très bien, recommençons depuis le début.');
    poserQuestion();
  }

  dire("Bonjour, je suis Awa, conseillère chez Madame Dacosta Services. 👋\nJe vais vous aider à créer votre compte candidat, étape par étape. Cela prend environ 2 minutes.");
  poserQuestion();
})();
