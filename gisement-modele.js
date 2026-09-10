/*
 * Gisement — le modèle de calcul, porté depuis gisement.py.
 *
 * Ce fichier ne touche pas au DOM : il se teste en Node comme dans le
 * navigateur. Toute divergence avec la version Python est un défaut, pas une
 * variante — c'est le même audit, calculé à deux endroits.
 *
 * Référence : https://github.com/JMProjectlab/Gisement/blob/main/docs/modele-de-calcul.md
 */
(function (racine) {
  "use strict";

  // Occurrences par an d'une tâche « une fois par … ». 220 jours ouvrés,
  // 46 semaines et 11 mois travaillés : les congés comptent.
  var FREQUENCES = {
    jour: 220, semaine: 46, quinzaine: 23, mois: 11,
    trimestre: 4, semestre: 2, an: 1
  };

  // Poids des cinq critères. Ils somment à 1.
  var POIDS = {
    repetitivite: 0.30,
    structuration: 0.25,
    acces_si: 0.20,
    jugement: 0.15,   // inversé : plus il y a de jugement, moins c'est automatisable
    criticite: 0.10   // inversé : plus l'erreur coûte cher, plus il faut de contrôle
  };
  var INVERSES = { jugement: true, criticite: true };

  var DEFAUTS = {
    plafond: 0.85,        // aucune automatisation ne supprime 100 % du temps
    coutHoraire: 45,      // coût horaire chargé
    tjm: 650,             // taux journalier de mise en œuvre
    retourVague1: 6,      // mois
    effortVague1: 5,      // jours
    retourVague2: 18,     // mois
    heuresEtp: 1600
  };

  /*
   * Python arrondit les demis vers l'entier pair — round(6.5) vaut 6, pas 7.
   * Math.round arrondit toujours vers le haut. Sur la formule d'effort, les
   * demis tombent systématiquement (le terme en 0,75), donc l'écart serait
   * visible sur des tâches réelles. On reproduit la règle de Python.
   */
  function arrondiPair(x) {
    var bas = Math.floor(x);
    var reste = x - bas;
    if (Math.abs(reste - 0.5) > 1e-9) return Math.round(x);
    return (bas % 2 === 0) ? bas : bas + 1;
  }

  function calculer(tache, reglages) {
    var p = Object.assign({}, DEFAUTS, reglages || {});
    var t = Object.assign({}, tache);

    var parAn = FREQUENCES[t.frequence];
    if (parAn === undefined) throw new Error("Fréquence inconnue : " + t.frequence);

    var coutHoraire = (t.cout_horaire === undefined || t.cout_horaire === null)
      ? p.coutHoraire : t.cout_horaire;

    t.heures_an = parAn * t.occurrences * (t.duree_min / 60) * (t.personnes || 1);
    t.cout_an = t.heures_an * coutHoraire;

    var total = 0;
    Object.keys(POIDS).forEach(function (critere) {
      var note = t[critere];
      if (INVERSES[critere]) note = 6 - note;
      total += POIDS[critere] * (note - 1) / 4;
    });
    // Même règle d'arrondi qu'en Python, un cran plus bas : round(76.25, 1)
    // y vaut 76.2, pas 76.3.
    t.score = arrondiPair(total * 100 * 10) / 10;

    t.taux_gain = p.plafond * total;
    t.heures_gagnees = t.heures_an * t.taux_gain;
    t.euros_gagnes = t.cout_an * t.taux_gain;

    // Une journée de socle, alourdie par ce qui manque. L'accès au système
    // d'information pèse le plus lourd : c'est lui qui fait dériver les projets.
    var effort = 1
      + (5 - t.structuration) * 0.75
      + (5 - t.acces_si) * 1.00
      + (t.criticite - 1) * 0.50;
    t.effort_jours = arrondiPair(effort * 2) / 2;
    t.cout_projet = t.effort_jours * p.tjm;

    var gainMensuel = t.euros_gagnes / 12;
    t.retour_mois = gainMensuel > 0 ? t.cout_projet / gainMensuel : Infinity;
    t.rendement = t.effort_jours ? t.euros_gagnes / t.effort_jours : 0;
    return t;
  }

  // Le classement se fait au rendement — euros gagnés par jour de mise en
  // œuvre — et non au gain brut : une équipe ne manque pas d'idées, elle
  // manque de jours.
  function prioriser(taches, reglages) {
    var p = Object.assign({}, DEFAUTS, reglages || {});
    return taches.slice()
      .sort(function (a, b) { return b.rendement - a.rendement; })
      .map(function (t) {
        if (t.retour_mois <= p.retourVague1 && t.effort_jours <= p.effortVague1) t.vague = 1;
        else if (t.retour_mois <= p.retourVague2) t.vague = 2;
        else t.vague = 3;
        return t;
      });
  }

  function totaux(taches, reglages) {
    var p = Object.assign({}, DEFAUTS, reglages || {});
    var somme = function (cle) {
      return taches.reduce(function (a, t) { return a + t[cle]; }, 0);
    };
    var gainE = somme("euros_gagnes");
    var invest = somme("cout_projet");
    return {
      heures: somme("heures_an"),
      cout: somme("cout_an"),
      gainHeures: somme("heures_gagnees"),
      gainEuros: gainE,
      invest: invest,
      jours: somme("effort_jours"),
      etp: somme("heures_gagnees") / p.heuresEtp,
      retourMois: gainE > 0 ? invest / (gainE / 12) : Infinity
    };
  }

  function auditer(taches, reglages) {
    var calculees = taches.map(function (t) { return calculer(t, reglages); });
    var ordonnees = prioriser(calculees, reglages);
    return { taches: ordonnees, totaux: totaux(ordonnees, reglages) };
  }

  var api = {
    FREQUENCES: FREQUENCES, POIDS: POIDS, DEFAUTS: DEFAUTS,
    arrondiPair: arrondiPair, calculer: calculer,
    prioriser: prioriser, totaux: totaux, auditer: auditer
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else racine.Gisement = api;
})(typeof self !== "undefined" ? self : this);
