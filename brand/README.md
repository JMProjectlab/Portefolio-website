# Ressources de marque

La référence est la page `charte.html`. Ce fichier ne documente que ce qui ne
se voit pas à l'écran : d'où viennent les fichiers.

## Les SVG sont la source

Les douze SVG sont écrits à la main. Depuis l'indice C de la charte, le
monogramme `JM` et le mot `PROJECTLAB` sont du **texte**, pas des tracés :
aucune police n'est embarquée, tout suit la pile système.

Conséquence : modifier le dessin du sceau se fait dans les SVG, jamais dans
les PNG.

## Les PNG sont générés

`favicon-16.png`, `favicon-32.png` et `apple-touch-icon.png` ne sont pas
dessinés. Ce sont des rendus des SVG, servis en repli aux clients qui ne
savent pas afficher une icône SVG.

| Fichier | Source | Fond |
|---|---|---|
| `favicon-16.png` | `logo-mark-ink.svg` | transparent |
| `favicon-32.png` | `logo-mark-ink.svg` | transparent |
| `apple-touch-icon.png` | `logo-icon-tile.svg`, **coins non arrondis** | bleu plein |

L'arrondi de l'icône Apple est retiré volontairement : iOS applique son propre
masque, et un arrondi déjà cuit dans l'image laisserait apparaître des coins
clairs sous ce masque.

**À régénérer dès que le sceau change.** Un PNG oublié est un logo qui dit
autre chose que le SVG à côté de lui.

Méthode : rasteriser le SVG à la taille cible dans un navigateur — le même
chemin que celui qu'emprunte le navigateur pour fabriquer une favicon — puis
enregistrer le résultat. Pas d'agrandissement ni de réduction après coup : on
rastérise directement à 16, 32 et 180.

## La police du rendu

Ces PNG ont été rasterisés sur une machine sans SF Pro. La pile système y
retombe sur Liberation Sans, métriquement identique à Arial, qui est la
dernière police de la pile du logo.

C'est donc exactement ce que voit déjà un visiteur sous Windows, dont le
navigateur ne trouve ni `-apple-system` ni SF Pro. Le repli est cohérent avec
le SVG pour ces visiteurs, et légèrement différent pour ceux sous macOS — qui
reçoivent le SVG, pas le PNG.
