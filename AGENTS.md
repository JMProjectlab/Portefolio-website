# Site JMprojectlab — guide de l'agent

La vitrine de l'atelier, en ligne sur **jmprojectlab.fr**. Trois pages HTML, une
feuille de style, un script. Aucune compilation, aucune dépendance.

Ce fichier dit **où ranger quoi** et **ce qu'il ne faut pas casser**.

---

## Où va quoi

| Tu veux… | Ça se passe dans |
|---|---|
| Changer le contenu de la page d'accueil | `index.html` |
| Mentions légales, confidentialité | `mentions-legales.html`, `confidentialite.html` |
| Style | `style.css` |
| Comportement | `script.js` |
| Icône d'une application présentée | `apps/<nom>-icon.png` |
| Logo, favicon, charte | `brand/` — la charte est `brand/charte.html` |

## Les règles à ne pas casser

### 1. Le piège de spécificité CSS

`.app-card p` porte une spécificité de (0,1,1). **Toute règle de couleur écrite
en classe seule sur un `<p>` d'une carte est silencieusement ignorée.** Il faut
qualifier par l'élément : `.app-card p.ma-classe`.

Le défaut ne se voit pas dans le diff, seulement au rendu. C'est ce qui justifie
d'ouvrir la page avant de fusionner, même pour trois lignes de CSS. Un
commentaire dans `style.css` le rappelle à l'endroit concerné — ne le supprime
pas.

### 2. Le bleu est réservé à ce qui se clique

Un statut, même important, se distingue par l'encre et la graisse, jamais par la
couleur des liens. `.app-status--live` en est l'exemple.

### 3. `CNAME` peut mettre le site hors ligne

Le fichier `CNAME` contient `jmprojectlab.fr`. Il a été écrit par GitHub quand
le domaine a été déclaré dans les réglages *Pages*, et il porte un **nom de
domaine nu**, jamais une URL.

Ne le modifie pas, ne le supprime pas, ne le renomme pas. Dès que GitHub connaît
un domaine personnalisé, il cesse de servir la page à l'ancienne adresse : si la
nouvelle ne répond pas, il ne reste rien de joignable. Un changement de domaine
se fait dans les réglages du dépôt, dans l'ordre acheter → DNS → déclarer, et
jamais en éditant ce fichier.

### 4. Le domaine personnalisé ne déplace que ce dépôt

Scornade et Ker Vélo Brière restent sur `jmprojectlab.github.io`. Les domaines
déclarés chez Apple pour « Se connecter avec Apple » restent valables. Ne
propose pas de « migrer » les autres sites par cohérence : ce sont des dépôts
distincts, et leurs adresses sont déclarées ailleurs.

### 5. L'éditeur est une personne physique

Mentions légales et politique de confidentialité décrivent un hébergement
GitHub Pages et un éditeur personne physique. Toute évolution du site qui
collecterait des données — formulaire, mesure d'audience, cookie — oblige à
reprendre ces deux pages. Signale-le avant d'écrire la fonctionnalité, pas
après.

## Vérifier avant de pousser

```bash
python3 -m http.server 8000       # puis ouvrir index.html, et la page modifiée
```

**Ouvrir la page est obligatoire**, pas optionnel : c'est le seul contrôle qui
existe ici. Pas de tests, pas de compilation, pas de linter. Une règle CSS
ignorée ou un lien cassé ne se voient qu'au rendu.

Vérifie les trois pages, pas seulement celle que tu as modifiée : elles
partagent `style.css`.

## Ce qui n'entre pas dans ce dépôt

Le dépôt est **public**. Aucune donnée personnelle au-delà de ce que les
mentions légales exposent déjà, aucune clé, aucun identifiant.

## Le reste du contexte

La bascule vers `jmprojectlab.fr`, les jalons, les pièges d'ordonnancement et
ce qui reste à répercuter hors du dépôt : second cerveau, dépôt `Brain`. Ce
guide ne le duplique pas.
