// Stockage partagé entre l'espace candidat et l'espace admin (démonstration : localStorage).
const MDS = (function () {
  const CLES = { candidats: 'mds-comptes', employeurs: 'mds-employeurs' };

  function lire(liste) {
    try { return JSON.parse(localStorage.getItem(CLES[liste])) || []; } catch { return []; }
  }

  function ajouter(liste, element) {
    const elements = lire(liste);
    elements.push(element);
    try { localStorage.setItem(CLES[liste], JSON.stringify(elements)); } catch { /* stockage indisponible */ }
  }

  // Une adresse e-mail ne peut servir qu'à un seul compte, candidat ou employeur.
  function emailDejaUtilise(email) {
    email = email.toLowerCase();
    return lire('candidats').some(c => c.email === email) || lire('employeurs').some(e => e.email === email);
  }

  async function empreinte(texte) {
    const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
    return Array.from(new Uint8Array(octets), o => o.toString(16).padStart(2, '0')).join('');
  }

  const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const telephoneValide = v => /^\+?\d{8,15}$/.test(v.replace(/[\s.\-()]/g, ''));
  const motDePasseValide = v => v.length >= 8 && /[a-zA-Z]/.test(v) && /\d/.test(v);

  return { lire, ajouter, emailDejaUtilise, empreinte, EMAIL_VALIDE, telephoneValide, motDePasseValide };
})();
