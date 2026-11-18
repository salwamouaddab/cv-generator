/* =========================================================
   Générateur de CV
   - "etat" contient toutes les données du CV
   - quand on tape dans le formulaire, on met à jour "etat"
     puis on redessine l'aperçu (renderCv)
   - le bouton PDF utilise l'impression du navigateur
   ========================================================= */

// Sections qui contiennent plusieurs éléments (on peut en ajouter / supprimer)
const SECTIONS = {
  experiences: { titre: "Expériences et stages", champs: [["poste", "Poste"], ["lieu", "Entreprise"], ["periode", "Période"], ["desc", "Description"]] },
  formations:  { titre: "Formation", champs: [["diplome", "Diplôme"], ["ecole", "École"], ["periode", "Période"]] },
  projets:     { titre: "Projets", champs: [["nom", "Nom du projet"], ["desc", "Description"]] }
};

// Exemple neutre affiché au départ (chaque visiteur le remplace par ses propres données)
const DEFAUT = {
  couleur: "#2f5d8a",
  nom: "Prénom Nom",
  titre: "Votre titre professionnel",
  email: "prenom.nom@exemple.com",
  tel: "+212 6 00 00 00 00",
  ville: "Ville, Pays",
  lien: "",
  profil: "Présentez-vous en quelques lignes : votre parcours, vos qualités et ce que vous recherchez.",
  competences: "HTML, CSS, JavaScript",
  langues: "Arabe, Français",
  experiences: [],
  formations: [{ diplome: "Votre diplôme", ecole: "Votre établissement", periode: "2024 - 2026" }],
  projets: [{ nom: "Nom du projet", desc: "Courte description du projet." }]
};

const CLE = "cv-generator-v1";
const formulaire = document.querySelector("#formulaire");
let photo = "";   // la photo reste en mémoire (non sauvegardée)

// ----- Sauvegarde dans le navigateur (localStorage) -----
function charger() {
  try { const s = localStorage.getItem(CLE); return s ? JSON.parse(s) : null; }
  catch (e) { return null; }
}
function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* ignoré */ }
}
let etat = Object.assign({}, DEFAUT, charger() || {});

// Protège le HTML : empêche qu'un texte tapé soit interprété comme du code
function esc(t) {
  return String(t || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ----- Formulaire : champs simples -----
function remplirChamps() {
  document.querySelectorAll("[data-champ]").forEach(el => { el.value = etat[el.dataset.champ] || ""; });
  document.querySelector("#couleur").value = etat.couleur;
}

// ----- Formulaire : listes (expériences, formations, projets) -----
function renderListes() {
  let html = "";
  for (const [cle, s] of Object.entries(SECTIONS)) {
    html += `<fieldset><legend>${s.titre}</legend>`;
    etat[cle].forEach((item, i) => {
      html += `<div class="item">`;
      s.champs.forEach(([k, label]) => {
        const attrs = `data-liste="${cle}" data-i="${i}" data-k="${k}"`;
        const champ = k === "desc"
          ? `<textarea rows="2" ${attrs}>${esc(item[k])}</textarea>`
          : `<input ${attrs} value="${esc(item[k])}">`;
        html += `<label>${label}${champ}</label>`;
      });
      html += `<button type="button" class="lien-suppr" data-suppr="${cle}" data-i="${i}">Supprimer</button></div>`;
    });
    html += `<button type="button" class="btn-ajout" data-ajout="${cle}">+ Ajouter</button></fieldset>`;
  }
  document.querySelector("#listes").innerHTML = html;
}

// ----- Aperçu du CV -----
function renderCv() {
  const e = etat;
  const cv = document.querySelector("#cv");
  cv.style.setProperty("--accent", e.couleur);

  const liste = t => String(t || "").split(",").map(x => x.trim()).filter(Boolean);
  const contacts = [e.email, e.tel, e.ville, e.lien].filter(Boolean).map(c => `<li>${esc(c)}</li>`).join("");
  const puces = (titre, t) => liste(t).length
    ? `<h3>${titre}</h3><ul>${liste(t).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  // N'affiche une section que si elle contient au moins un élément rempli
  const bloc = (titre, items, modele) => {
    const remplis = items.filter(it => Object.values(it).some(v => v.trim()));
    return remplis.length ? `<h3>${titre}</h3>` + remplis.map(modele).join("") : "";
  };

  cv.innerHTML = `
    <aside class="cv-lateral">
      ${photo ? `<img class="cv-photo" src="${photo}" alt="">` : ""}
      <h3>Contact</h3><ul>${contacts}</ul>
      ${puces("Compétences", e.competences)}
      ${puces("Langues", e.langues)}
    </aside>
    <div class="cv-principal">
      <h2>${esc(e.nom)}</h2>
      <p class="cv-titre">${esc(e.titre)}</p>
      ${e.profil.trim() ? `<h3>Profil</h3><p>${esc(e.profil)}</p>` : ""}
      ${bloc("Expériences et stages", e.experiences, it => `
        <div class="entree"><div class="ligne"><strong>${esc(it.poste)}</strong><span>${esc(it.periode)}</span></div>
        <div class="sous">${esc(it.lieu)}</div><p>${esc(it.desc)}</p></div>`)}
      ${bloc("Formation", e.formations, it => `
        <div class="entree"><div class="ligne"><strong>${esc(it.diplome)}</strong><span>${esc(it.periode)}</span></div>
        <div class="sous">${esc(it.ecole)}</div></div>`)}
      ${bloc("Projets", e.projets, it => `
        <div class="entree"><strong>${esc(it.nom)}</strong><p>${esc(it.desc)}</p></div>`)}
    </div>`;
}

function majApercu() { renderCv(); sauver(); }

// ----- Événements -----
// Quand on tape dans un champ : on met à jour les données puis l'aperçu
formulaire.addEventListener("input", ev => {
  const t = ev.target;
  if (t.dataset.champ) etat[t.dataset.champ] = t.value;
  else if (t.dataset.liste) etat[t.dataset.liste][t.dataset.i][t.dataset.k] = t.value;
  else return;
  majApercu();
});

// Boutons "Ajouter" et "Supprimer"
formulaire.addEventListener("click", ev => {
  const t = ev.target;
  if (t.dataset.ajout) {
    const cle = t.dataset.ajout;
    etat[cle].push(Object.fromEntries(SECTIONS[cle].champs.map(([k]) => [k, ""])));
    renderListes(); majApercu();
  } else if (t.dataset.suppr) {
    etat[t.dataset.suppr].splice(Number(t.dataset.i), 1);
    renderListes(); majApercu();
  }
});

// Photo : lue localement par le navigateur, jamais envoyée sur internet
document.querySelector("#photo").addEventListener("change", ev => {
  const fichier = ev.target.files[0];
  if (!fichier) { photo = ""; renderCv(); return; }
  const lecteur = new FileReader();
  lecteur.onload = () => { photo = lecteur.result; renderCv(); };
  lecteur.readAsDataURL(fichier);
});

document.querySelector("#couleur").addEventListener("input", ev => { etat.couleur = ev.target.value; majApercu(); });

// PDF : on ouvre la fenêtre d'impression (le CSS n'imprime que le CV)
document.querySelector("#btnPdf").addEventListener("click", () => {
  const ancien = document.title;
  document.title = "CV - " + (etat.nom || "");   // nom du fichier PDF proposé
  window.print();
  document.title = ancien;
});

// ----- Démarrage -----
remplirChamps();
renderListes();
renderCv();
