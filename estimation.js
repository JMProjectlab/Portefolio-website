/*
 * Le questionnaire : construction des champs, calcul, rendu du résultat.
 * Le modèle vit dans gisement-modele.js et n'est pas dupliqué ici.
 */
(function () {
  "use strict";

  /* -----------------------------------------------------------------------
   * Notation assistée — à renseigner après avoir déployé le Worker
   * (voir Gisement/worker/README.md). Tant que ces deux valeurs sont vides,
   * la page fonctionne exactement comme avant, avec ses listes déroulantes :
   * aucune fonctionnalité ne dépend d'un service qui pourrait ne pas exister.
   * --------------------------------------------------------------------- */
  var QUALIFIEUR_URL = "";
  var TURNSTILE_SITE_KEY = "";

  var iaDisponible = Boolean(QUALIFIEUR_URL && TURNSTILE_SITE_KEY);

  var liste = document.getElementById("liste-taches");
  if (!liste) return;   // page sans questionnaire

  var MAX_TACHES = 8;

  // Les cinq critères, posés comme des questions auxquelles un responsable peut
  // répondre sans grille de lecture. L'ordre des réponses va toujours du moins
  // au plus automatisable, sauf pour les deux critères inversés où il est dit.
  var CRITERES = [
    { cle: "repetitivite", question: "À chaque fois, le travail est-il le même ?",
      choix: ["Toujours différent", "Souvent différent", "Moitié-moitié",
              "Presque identique", "Rigoureusement identique"] },
    { cle: "structuration", question: "Où sont les informations nécessaires ?",
      choix: ["Éparses : oral, papier, mails", "Surtout dans des PDF ou des mails",
              "Un peu des deux", "Dans des fichiers réguliers",
              "Dans une base ou un export au format stable"] },
    { cle: "jugement", question: "Quelle part de décision la tâche demande-t-elle ?",
      choix: ["Aucune, on applique une règle", "Très peu", "Un arbitrage de temps en temps",
              "Souvent du jugement", "Arbitrage d'expert, responsabilité engagée"] },
    { cle: "criticite", question: "Que coûte une erreur sur cette tâche ?",
      choix: ["Rien, ça se corrige", "Un peu de temps perdu", "Un client mécontent",
              "De l'argent", "De l'argent, un client ou une non-conformité"] },
    { cle: "acces_si", question: "Peut-on sortir ces données de vos outils ?",
      choix: ["Non, tout se lit à l'écran", "Copie manuelle seulement",
              "Un export pénible existe", "Un export propre existe",
              "Oui : API, base ou export automatisable"] }
  ];

  var FREQUENCES = [
    ["jour", "par jour"], ["semaine", "par semaine"], ["quinzaine", "par quinzaine"],
    ["mois", "par mois"], ["trimestre", "par trimestre"], ["semestre", "par semestre"],
    ["an", "par an"]
  ];

  var compteur = 0;

  function elt(balise, classe, texte) {
    var e = document.createElement(balise);
    if (classe) e.className = classe;
    if (texte !== undefined) e.textContent = texte;
    return e;
  }

  function champ(id, libelle) {
    var d = elt("div", "form-row");
    var l = elt("label", null, libelle);
    l.setAttribute("for", id);
    d.appendChild(l);
    return d;
  }

  function selecteur(id, options) {
    var s = elt("select");
    s.id = id;
    options.forEach(function (o, i) {
      var opt = elt("option", null, Array.isArray(o) ? o[1] : o);
      opt.value = Array.isArray(o) ? o[0] : (i + 1);
      s.appendChild(opt);
    });
    return s;
  }

  function nombre(id, valeur, min, pas) {
    var i = elt("input");
    i.type = "number"; i.id = id; i.value = valeur;
    i.min = min === undefined ? 0 : min;
    i.step = pas === undefined ? 1 : pas;
    return i;
  }

  function ajouterTache(prefill) {
    if (liste.children.length >= MAX_TACHES) return;
    compteur += 1;
    var n = compteur;
    var carte = elt("article", "tache-carte");
    carte.dataset.index = n;

    var tete = elt("div", "tache-tete");
    tete.appendChild(elt("h3", null, "Tâche"));
    var sup = elt("button", "lien-discret", "Retirer");
    sup.type = "button";
    sup.addEventListener("click", function () { carte.remove(); renumeroter(); });
    tete.appendChild(sup);
    carte.appendChild(tete);

    var cNom = champ("nom-" + n, "Quelle est cette tâche ?");
    var iNom = elt("input"); iNom.type = "text"; iNom.id = "nom-" + n;
    iNom.placeholder = "Ex : ressaisir les commandes reçues par mail";
    cNom.appendChild(iNom);
    carte.appendChild(cNom);

    var cDesc = champ("desc-" + n, "Décrivez-la en une phrase");
    var iDesc = elt("textarea");
    iDesc.id = "desc-" + n; iDesc.rows = 2; iDesc.maxLength = 600;
    iDesc.placeholder = "Ex : les commandes arrivent en PDF ou dans le corps du mail, un assistant les retape une par une dans l'ERP.";
    cDesc.appendChild(iDesc);
    var aideDesc = elt("p", "aide", iaDisponible
      ? "Sert à la notation assistée ci-dessous, et part dans le CSV pour l'audit complet."
      : "Facultatif. Reprise dans le CSV exporté, elle évite de tout réexpliquer pour l'audit complet.");
    cDesc.appendChild(aideDesc);
    carte.appendChild(cDesc);

    var grille = elt("div", "champs-grille");

    var cFreq = champ("freq-" + n, "À quelle fréquence ?");
    cFreq.appendChild(selecteur("freq-" + n, FREQUENCES));
    grille.appendChild(cFreq);

    var cOcc = champ("occ-" + n, "Combien de fois par période ?");
    cOcc.appendChild(nombre("occ-" + n, 1, 0.5, 0.5));
    grille.appendChild(cOcc);

    var cDur = champ("dur-" + n, "Combien de minutes à chaque fois ?");
    cDur.appendChild(nombre("dur-" + n, 15, 1, 1));
    grille.appendChild(cDur);

    var cPers = champ("pers-" + n, "Combien de personnes mobilisées ?");
    cPers.appendChild(nombre("pers-" + n, 1, 1, 1));
    grille.appendChild(cPers);

    carte.appendChild(grille);

    CRITERES.forEach(function (c) {
      var id = c.cle + "-" + n;
      var ch = champ(id, c.question);
      var sel = selecteur(id, c.choix);
      sel.selectedIndex = 2;   // « moitié-moitié » par défaut : ni optimiste ni pessimiste
      ch.appendChild(sel);
      carte.appendChild(ch);
    });

    liste.appendChild(carte);
    renumeroter();

    if (prefill) {
      iNom.value = prefill.nom;
      if (prefill.description) document.getElementById("desc-" + n).value = prefill.description;
      document.getElementById("freq-" + n).value = prefill.frequence;
      document.getElementById("occ-" + n).value = prefill.occurrences;
      document.getElementById("dur-" + n).value = prefill.duree;
      CRITERES.forEach(function (c) {
        if (prefill[c.cle]) document.getElementById(c.cle + "-" + n).selectedIndex = prefill[c.cle] - 1;
      });
    }
    return carte;
  }

  function renumeroter() {
    Array.prototype.forEach.call(liste.children, function (carte, i) {
      carte.querySelector("h3").textContent = "Tâche " + (i + 1);
      var sup = carte.querySelector(".lien-discret");
      sup.hidden = liste.children.length <= 1;
    });
    document.getElementById("ajouter").disabled = liste.children.length >= MAX_TACHES;
  }

  function lire() {
    var taches = [], vides = 0;
    var coutHoraire = parseFloat(document.getElementById("cout-horaire").value) || 45;

    Array.prototype.forEach.call(liste.children, function (carte) {
      var n = carte.dataset.index;
      var nom = document.getElementById("nom-" + n).value.trim();
      var duree = parseFloat(document.getElementById("dur-" + n).value);
      var occ = parseFloat(document.getElementById("occ-" + n).value);
      if (!nom || !(duree > 0) || !(occ > 0)) { vides += 1; return; }

      var t = {
        tache: nom,
        description: document.getElementById("desc-" + n).value.trim(),
        frequence: document.getElementById("freq-" + n).value,
        occurrences: occ,
        duree_min: duree,
        personnes: parseFloat(document.getElementById("pers-" + n).value) || 1,
        cout_horaire: coutHoraire
      };
      CRITERES.forEach(function (c) {
        t[c.cle] = parseInt(document.getElementById(c.cle + "-" + n).value, 10);
      });
      taches.push(t);
    });
    return { taches: taches, vides: vides, coutHoraire: coutHoraire };
  }

  var eur = function (x) {
    return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
  };
  var heures = function (x) {
    return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " h";
  };
  var retour = function (t) {
    if (!isFinite(t.retour_mois)) return "—";
    return t.retour_mois < 1 ? "< 1 mois" : Math.round(t.retour_mois) + " mois";
  };

  var dernier = null;

  function calculer() {
    var msg = document.getElementById("message");
    var saisie = lire();

    if (!saisie.taches.length) {
      msg.textContent = "Renseignez au moins une tâche : son nom, sa fréquence et sa durée.";
      msg.className = "message-formulaire message-alerte";
      return;
    }
    msg.textContent = saisie.vides
      ? saisie.vides + " tâche(s) incomplète(s) ignorée(s)."
      : "";
    msg.className = "message-formulaire";

    var res = Gisement.auditer(saisie.taches, { coutHoraire: saisie.coutHoraire });
    dernier = { saisie: saisie, res: res };
    rendre(res);
    document.getElementById("resultat").hidden = false;
    document.getElementById("resultat").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function carteChiffre(cle, valeur, note, fort) {
    var d = elt("div", "carte-chiffre" + (fort ? " fort" : ""));
    d.appendChild(elt("p", "k", cle));
    d.appendChild(elt("p", "v", valeur));
    d.appendChild(elt("p", "n", note));
    return d;
  }

  function rendre(res) {
    var t = res.totaux;
    var nb = res.taches.length;

    document.getElementById("resume-tete").textContent =
      nb + (nb > 1 ? " tâches décrites" : " tâche décrite") +
      ", calculées avec le modèle du diagnostic complet.";

    var c = document.getElementById("chiffres");
    c.innerHTML = "";
    c.appendChild(carteChiffre("Temps consommé", heures(t.heures), "par an, sur ces tâches"));
    c.appendChild(carteChiffre("Coût annuel", eur(t.cout), "temps de travail chargé"));
    c.appendChild(carteChiffre("Temps libérable", heures(t.gainHeures),
      "soit " + t.etp.toFixed(2) + " ETP", true));
    c.appendChild(carteChiffre("Gain annuel", eur(t.gainEuros), "à périmètre constant", true));
    c.appendChild(carteChiffre("Mise en œuvre", eur(t.invest),
      t.jours.toFixed(1) + " jours estimés"));
    c.appendChild(carteChiffre("Retour",
      isFinite(t.retourMois) ? t.retourMois.toFixed(1) + " mois" : "—",
      "sur l'ensemble"));

    var titres = {
      1: ["À lancer tout de suite", "Retour en moins de six mois, moins de cinq jours de mise en œuvre."],
      2: ["À instruire", "Rentable sur dix-huit mois, mais demande une décision avant de commencer."],
      3: ["À ne pas faire pour l'instant", "Techniquement possible, économiquement non."]
    };
    var zone = document.getElementById("vagues");
    zone.innerHTML = "";

    [1, 2, 3].forEach(function (v) {
      var dedans = res.taches.filter(function (x) { return x.vague === v; });
      if (!dedans.length) return;

      var bloc = elt("div", "vague-bloc v" + v);
      bloc.appendChild(elt("h3", null, "Vague " + v + " — " + titres[v][0]));
      bloc.appendChild(elt("p", "sous", titres[v][1]));

      var enveloppe = elt("div", "apercu-defile");
      var table = elt("table");
      table.innerHTML = "<thead><tr><th>Tâche</th><th class='num'>Temps / an</th>" +
        "<th class='num'>Score</th><th class='num'>Gain / an</th>" +
        "<th class='num'>Effort</th><th class='num'>Retour</th></tr></thead>";
      var corps = elt("tbody");
      dedans.forEach(function (x) {
        var tr = elt("tr");
        [[x.tache, ""], [heures(x.heures_an), "num"], [Math.round(x.score) + "/100", "num"],
         [eur(x.euros_gagnes), "num"], [x.effort_jours.toFixed(1) + " j", "num"],
         [retour(x), "num"]].forEach(function (paire) {
          var td = elt("td", paire[1] || null, paire[0]);
          tr.appendChild(td);
        });
        corps.appendChild(tr);
      });
      table.appendChild(corps);
      enveloppe.appendChild(table);
      bloc.appendChild(enveloppe);
      zone.appendChild(bloc);
    });
  }

  function telecharger() {
    if (!dernier) return;
    var entetes = ["tache", "equipe", "description", "frequence", "occurrences",
      "duree_min", "personnes", "cout_horaire", "repetitivite", "structuration",
      "jugement", "criticite", "acces_si"];
    var echapper = function (v) {
      v = String(v === undefined || v === null ? "" : v);
      return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    var lignes = [entetes.join(";")];
    dernier.saisie.taches.forEach(function (t) {
      lignes.push(entetes.map(function (h) { return echapper(t[h]); }).join(";"));
    });
    // Le BOM fait ouvrir le fichier correctement dans Excel en français.
    var blob = new Blob(["﻿" + lignes.join("\n") + "\n"],
      { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "inventaire-gisement.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }


  /* ---------------------------------------------------------------------
   * Notation assistée par Claude, via le Worker.
   *
   * Trois principes : la clé n'est jamais ici (le Worker la détient), une note
   * saisie à la main n'est jamais écrasée, et tout échec retombe sur les
   * listes déroulantes sans casser la page.
   * ------------------------------------------------------------------- */

  var widgetTurnstile = null;

  function preparerIA() {
    if (!iaDisponible) return;

    var zone = document.getElementById("bloc-ia");
    zone.hidden = false;

    var script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = function () {
      widgetTurnstile = window.turnstile.render("#turnstile", {
        sitekey: TURNSTILE_SITE_KEY, size: "flexible"
      });
      document.getElementById("noter-ia").disabled = false;
    };
    // Si le script ne charge pas — bloqueur, réseau coupé — on retire
    // proprement l'offre plutôt que de laisser un bouton mort.
    script.onerror = function () { zone.hidden = true; };
    document.head.appendChild(script);
  }

  function appliquerNotations(notations) {
    var parNumero = {};
    Array.prototype.forEach.call(liste.children, function (carte, i) {
      parNumero[i + 1] = carte.dataset.index;
    });
    var appliquees = 0;
    notations.forEach(function (n) {
      var idx = parNumero[n.numero];
      if (!idx) return;
      CRITERES.forEach(function (c) {
        var sel = document.getElementById(c.cle + "-" + idx);
        var v = parseInt(n[c.cle], 10);
        if (sel && v >= 1 && v <= 5) sel.selectedIndex = v - 1;
      });
      var carte = liste.querySelector('[data-index="' + idx + '"]');
      var ancien = carte.querySelector(".retour-ia");
      if (ancien) ancien.remove();
      if (n.approche || n.risque) {
        var d = elt("div", "retour-ia");
        if (n.approche) {
          var a = elt("p"); a.appendChild(elt("strong", null, "Approche proposée : "));
          a.appendChild(document.createTextNode(n.approche)); d.appendChild(a);
        }
        if (n.risque) {
          var r = elt("p"); r.appendChild(elt("strong", null, "Risque principal : "));
          r.appendChild(document.createTextNode(n.risque)); d.appendChild(r);
        }
        carte.appendChild(d);
      }
      appliquees += 1;
    });
    return appliquees;
  }

  function noterParIA() {
    var msg = document.getElementById("message-ia");
    var bouton = document.getElementById("noter-ia");

    var aEnvoyer = [];
    Array.prototype.forEach.call(liste.children, function (carte, i) {
      var n = carte.dataset.index;
      var nom = document.getElementById("nom-" + n).value.trim();
      var desc = document.getElementById("desc-" + n).value.trim();
      if (nom && desc.length >= 15) {
        aEnvoyer.push({
          numero: i + 1, tache: nom, description: desc,
          frequence: document.getElementById("freq-" + n).value,
          duree_min: parseFloat(document.getElementById("dur-" + n).value) || null
        });
      }
    });

    if (!aEnvoyer.length) {
      msg.textContent = "Décrivez au moins une tâche en une phrase pour que la notation ait de quoi travailler.";
      msg.className = "message-formulaire message-alerte";
      return;
    }

    var jeton = widgetTurnstile !== null && window.turnstile
      ? window.turnstile.getResponse(widgetTurnstile) : "";
    if (!jeton) {
      msg.textContent = "La vérification anti-robot n'est pas encore prête. Patientez une seconde et réessayez.";
      msg.className = "message-formulaire message-alerte";
      return;
    }

    bouton.disabled = true;
    msg.textContent = "Notation en cours…";
    msg.className = "message-formulaire";

    var controleur = new AbortController();
    var expire = setTimeout(function () { controleur.abort(); }, 60000);

    fetch(QUALIFIEUR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: jeton, taches: aEnvoyer }),
      signal: controleur.signal
    }).then(function (r) {
      return r.json().then(function (j) { return { statut: r.status, corps: j }; });
    }).then(function (res) {
      if (res.statut !== 200) {
        throw new Error(res.corps && res.corps.erreur
          ? res.corps.erreur
          : "La notation a échoué.");
      }
      var n = appliquerNotations(res.corps.taches || []);
      msg.textContent = n + (n > 1 ? " tâches notées." : " tâche notée.") +
        " Vérifiez les réponses : ce sont des estimations à partir de votre description, corrigez ce qui vous semble faux.";
      msg.className = "message-formulaire";
    }).catch(function (e) {
      msg.textContent = (e && e.name === "AbortError")
        ? "La notation a mis trop de temps. Utilisez les listes déroulantes."
        : (e.message || "La notation a échoué.") + " Les listes déroulantes restent disponibles.";
      msg.className = "message-formulaire message-alerte";
    }).then(function () {
      clearTimeout(expire);
      bouton.disabled = false;
      // Un jeton Turnstile ne sert qu'une fois.
      if (widgetTurnstile !== null && window.turnstile) window.turnstile.reset(widgetTurnstile);
    });
  }

  document.getElementById("ajouter").addEventListener("click", function () { ajouterTache(); });
  document.getElementById("calculer").addEventListener("click", calculer);
  document.getElementById("telecharger").addEventListener("click", telecharger);
  if (iaDisponible) {
    document.getElementById("noter-ia").addEventListener("click", noterParIA);
    preparerIA();
  }

  // Une première tâche pré-remplie : une page qui s'ouvre sur un formulaire vide
  // ne dit pas ce qu'on attend de vous.
  ajouterTache({
    nom: "Ressaisir les commandes reçues par mail",
    description: "Les commandes arrivent en PDF ou dans le corps du mail, un assistant les retape une par une dans l'ERP. Le format change selon le client.",
    frequence: "jour", occurrences: 12, duree: 6,
    repetitivite: 5, structuration: 2, jugement: 1, criticite: 4, acces_si: 3
  });
})();
