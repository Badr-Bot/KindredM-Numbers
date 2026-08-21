# PLAYBOOK CRÉAS — la matière de la formation, extraite

> Extraction du 21/08 (agents sur le corpus `docs/formation/`), domaines :
> angles · hooks · scripts · formats. **Statut : la passe de re-vérification a
> été interrompue (limite de dépense)** — chaque règle porte sa source
> leçon + timestamp : en cas d'enjeu, rouvrir la transcription avant de tourner.
> Les règles de BATCH, ADCOPY et SUIVI sont dans `docs/formation/REGLES.md`
> §3-4 (vérifiées) ; la codification dans `CODIFICATION.md` ; les winners
> réels dans `WINNERS-META.md`.
>
> Machine à créas : la skill `machine-creas` consomme ce fichier pour remplir
> l'Excel de production.

---

## 🎯 Angles, conscience, sophistication

> Mon domaine fournit les 3 axes qui déterminent CE QU'ON DIT avant même d'écrire un hook : (1) le niveau de conscience du prospect (5 stages : unaware → problem → solution → product → most aware), qui impose l'ordre des blocs et ce qu'on écrit à chaque stage ; (2) le stade de sophistication du marché (1 à 5), qui sert AVANT à choisir produit/positionnement et décide s'il faut un mécanisme unique ; (3) l'avatar (persona démographique + persona psychologique + ethnie) et son angle marketing, un seul par créa. Le « mécanisme » est le pivot : on mécanise le problème comme un médecin, puis le mécanisme unique de la solution est l'exact inverse. Toute la matière (angles, verbatims, objections, failed solutions) sort du review mining (Amazon + Trustpilot + GigaBrain) via des prompts fournis mot pour mot. Formule de production : (Message/angle × (Avatar × Awareness) × Concept) × Coherence Index.

### Les 5 stages de conscience du prospect (awareness) — ce qu'on écrit à chacun
*Source : MASTER ACQUISITION / 02, 03, 04, 05 — Les différents niveaux de conscience #1 à #4 (transcriptions/master-acquisition/02→05). Pyramide présentée en 02 [00:45]–[03:25], puis détaillée : Most/Product/Solution aware en 03, Problem/Unaware en 04, exemples d'ads en 05.*

- **Unaware (le plus scalable, le plus difficile)** — « ils savent même pas qu'ils ont un problème » (04 [08:12]). On doit éduquer sur l'existence du problème et « présenter le produit comme la seule et la meilleure solution par rapport à ce problème » (04 [08:56]). Format : vidéo longue / VSL — « on fait des longues vidéos de vente, c'est qu'on commence très large et ensuite on introduit le problème et après on fait de les autres couches » (04 [10:00]). Il faut « éduquer, sensibiliser subtilement » et être bon sur tout l'aspect de la vidéo pour garder l'attention à travers les couches (04 [09:40]).
  - *Ex :* VSL analysée en 05 [00:00]–[02:52] : « depuis 300 ans ces femmes japonaises plongent sans masque oxygène et sans équipement pour aller collecter des perles » → histoire → introduction du problème (le ronflement / snoring) → explication du mécanisme (« comment le corps fonctionne ») → discrédit des autres solutions → produit → offre. Autre exemple donné : problème de coude — « voici une histoire d'un petit américain, il avait des problèmes… il utilisait une gêne pour le coude » (04 [08:56]–[09:19]).
- **Problem aware** — « le prospect, il a un problème clair dans sa vie. Ça le dérange. Il sait pas encore quelle solution précise peut l'aider, ou il sait pas encore qu'une solution existe » (04 [00:25]). Séquence à écrire : 1) parler du problème EN EXPERT ; 2) MÉCANISER le problème (explication scientifique) ; 3) appuyer / amplifier les douleurs du quotidien ; 4) introduire la solution comme inévitable ; 5) nommer le mécanisme unique de la solution (= inverse du mécanisme du problème) ; 6) introduire le produit ; 7) social proof + avant/après subtils (04 [01:56]→[06:25]). On peut « rajouter des couches » ensuite pour discréditer les autres solutions/produits (04 [06:25]).
  - *Ex :* Cheveux : « la perte de cheveux touche 80% de la population depuis 40 ans » → « c'est une maladie dégénérative qui touche les personnes parce qu'ils ont un problème de circulation du sang dans le crâne » → douleurs : « pour les femmes, c'est une perte de féminité. Ça peut être très difficile de trouver un conjoint… Chaque fois qu'on se regarde dans le miroir, on s'en veut » → « vous devez absolument faire restimuler la circulation sanguine dans votre crâne » → « un shampoing qui permet de naturellement réactiver la circulation sanguine » (04 [02:20]→[06:04]).
- **Solution aware** — « il sait qu'il a un problème. Il sait c'est quoi le problème. Il connaît plusieurs solutions différentes, mais c'est pas qu'il y a votre produit qui peut le résoudre » (03 [04:30]). Audience « très grande, encore plus que celle qu'on a vu avant » (03 [05:14]). Message : parler du problème PUIS discréditer LES AUTRES SOLUTIONS (pas les autres marques de votre catégorie), puis introduire votre catégorie de solution, puis votre produit/offre (03 [05:14]→[07:01]).
  - *Ex :* Hack de phrase donné mot pour mot : « La plupart de ceux qui veulent [éviter de perdre leurs cheveux] utilisent des pilules ou des brosses. Le problème avec ça, c'est que la perte de cheveux ne se résout pas avec une brosse, ça masque seulement le problème » (03 [05:36]–[05:57]). Hook alternatif : « trois raisons pour lesquelles les pilules ne sont pas la meilleure solution pour faire repousser les cheveux » puis « il existe une solution naturelle pour faire pousser les cheveux et c'est le shampoing » (03 [06:40]–[07:01]). Ad analysée en 05 [02:52] : « Est-ce que ce nouveau produit viral pour la perte de cheveux vaut vraiment sa viralité ? » — produit non nommé, médecin, avant/après, discrédit des greffes (« ça coûte cher »), puis mécanisme : « il utilise exactement le même mécanisme que dans les cliniques pour faire grandir les cheveux sans piqûre », puis prix (« moins de 150 dollars par rapport à la chirurgie »), garantie 120 jours, -50%.
- **Product aware** — « il est sûr du produit, il est sûr que le shampoing c'est ce qui convient le mieux à son problème… Maintenant il va venir comparer les marques » (03 [02:33]). Message : discréditer LES AUTRES MARQUES, expliquer pourquoi le vôtre est mieux (avantage unique, prix, mécanisme unique, naturel vs non naturel), créer un pic émotionnel, prouver la supériorité. « la meilleure moyen pour convaincre que le vôtre est le meilleur, c'est de discréditer les autres » (03 [03:20]). Plutôt top/middle of funnel (05 [06:33]).
  - *Ex :* Ad analysée en 05 [06:11] : « 3 raisons pourquoi je recommande le produit. En tant que master esthéticien » + économies vs autres technologies + « c'est safe, pas intrusif, vous pouvez utiliser depuis la maison » + money-back guarantee. Script complet « Discredit » (product aware) : « Don't buy the Space Buddy » (voir typologie dédiée).
- **Most aware (le plus facile, le moins scalable)** — « les prospects connaissent notre produit. Ils ont besoin, ils prévoient de l'acheter, ils ont juste besoin d'une dernière incitation à acheter » (03 [00:01]). Créative simple : produit + offre. Facteurs gagnants = « le timing et la meilleure offre » (03 [01:03]). Audience peu scalable, mais à ne JAMAIS arrêter : « il ne faut pas oublier de continuellement faire des ads qui parlent de votre offre » (03 [01:03]–[01:25]).
  - *Ex :* « on reprend nos meilleures créatives et simplement, vous allez venir changer le début de la créative, vous allez mettre : là on a l'offre la plus basse jamais vue… vous achetez et vous avez un cadeau plus 60% de réduction » — « là on est en train de dépenser plus de 500 K sur une créative » (03 [01:25]–[02:11]). Statique équivalente : produit + prix barré + prix du jour (CRÉATIVE INSIGHT / 34 Ep #28 [00:48]–[01:14]).

### Les 5 niveaux de sophistication du marché (market sophistication level)
*Source : MASTER ACQUISITION / 02 — Les différents niveaux de conscience #1, [03:51]→[09:44]*

- **Niveau 1 — Océan bleu** — « quand vous arrivez avec un produit c'est que c'est tout nouveau pour le marché. C'est-à-dire le marché n'a jamais vu ce produit. Donc il sait pas ce que c'est et il va falloir si le produit est compliqué éduquer le marché. Et là par contre il y a énormément de personnes à toucher parce que vous êtes le seul » (02 [04:35]).
  - *Ex :* « une brosse pour les cheveux qui fait repousser les cheveux. Le marché n'a jamais vu ça » (02 [05:20]–[05:42]).
- **Niveau 2 — Le meilleur niveau** — « votre marché connaît déjà le produit, il y a du désir, beaucoup de désir, il y a des acteurs qui se mettent en place et il y a énormément d'argent à aller chercher » (02 [04:57]). Marketing orienté problem aware / solution aware, PAS produit — « les gens ne connaissent pas la brosse de cheveux pour faire repousser les cheveux, ça sert à rien de leur dire achetez ma brosse » (02 [06:02]). Le simple fait de montrer le produit commence à marcher (02 [06:23]).
  - *Ex :* « c'est là que je dis il y a le plus d'argent à faire parce qu'avec du simple marketing vous allez venir convaincre ceux qui ont déjà été éduqués » (02 [06:23]).
- **Niveau 3 — Marché éduqué** — « le marché est de plus en plus éduqué, donc là ça se complexifie, il va falloir avoir des meilleures propositions de valeur » : un meilleur mécanisme, une meilleure qualité, faire parler son branding et son positionnement (02 [06:47]).
  - *Ex :* « ma brosse elle fait pousser les cheveux parce qu'elle a un mécanisme mieux, elle a la lumière rouge par rapport aux autres brosses » (02 [06:47]).
- **Niveau 4 — Saturé** — « là c'est saturé… il va falloir être très bon en copywriting, il va falloir avoir un bon branding et niveau timing » (02 [07:09]). Copier une ad de niveau 4 = « vous allez venir manger des miettes » (02 [07:31]). Outscaler = stratégie longue : « ça peut pas se faire en une semaine… en travaillant des bonnes ads, en venant chercher toutes les stages de prospects, en éduquant sous votre marque, mais vous devez créer un positionnement unique » (02 [07:52]).
  - *Ex :* « il y a beaucoup de personnes qui se sont mises sur cette brosse à cheveux, il y a plein de brosses à cheveux différentes » (02 [07:09]).
- **Niveau 5 — Ultra saturé** — « il faut même travailler au niveau de son produit. Si vous arrivez avec le même produit que les autres… il va falloir trouver un unique mécanisme différent et vous trouvez un marché différent » (02 [08:16]). Ou augmenter la promesse. « vous pouvez pas vous battre dans le level 5 » — il faut recréer un océan bleu (02 [08:38]).
  - *Ex :* T-shirts : « les t-shirts c'est le niveau 5 parce que tout le monde sait ce que c'est, c'est ultra saturé » (02 [03:51]). Sorties : mécanisme (« une brosse qui utilise des ondes magnétiques et ça ça a jamais été vu sur le marché », 02 [08:16]) ; nouveau marché/avatar (« une brosse de cheveux qui permet de faire repousser les poils aux chiens », 02 [09:01]) ; bijou (« ce bijou-là il fait perdre du poids » puis, si saturé, « peut-être que vous faites perdre du poids de la manière la plus simple… il va falloir augmenter votre promesse », 02 [09:44]).

### Sophistication vs Awareness — deux outils différents, deux moments différents
*Source : RESSOURCES GOOGLE / 05 — 33 Sophistication simplifié (doc) + 0 TO 1 MASTER ONE / 33 — Sophistication simplifié [00:00]→[07:44]*

- **Sophistication = état du marché (externe)** — « La sophistication, c'est l'état du marché… VOTRE OUTIL DE RECHERCHE PRODUIT (d'opportunités). Sophistication : vous l'utilisez avant de choisir votre produit. C'est votre filtre de sélection. » Elle se mesure au nombre de concurrents sur le marché/pays visé et à la ressemblance de leurs pubs.
  - *Ex :* « la sophistication c'est le nombre de concurrents que vous avez sur un certain produit marché » (0 to 1 / 33 [03:32]).
- **Awareness = état d'esprit du client (interne)** — « L'awareness, c'est différent. Ça ne sert pas à choisir votre produit. Ça sert à construire vos publicités une fois que vous avez trouvé votre produit… Retenez juste que c'est un outil de construction de pub, pas un outil de sélection produit. »
  - *Ex :* « Est-ce que votre client sait qu'il a un problème ? Est-ce qu'il sait qu'une solution existe ? Est-ce qu'il connaît votre produit ? »
- **Checklist Sophistication Débutant (3 questions)** — 1) « Est-ce que je vois des dizaines de marques qui vendent exactement la même chose ? (sur le marché en question, + ils se lancent aux mêmes moments) » 2) « Est-ce que toutes leurs pubs utilisent les mêmes accroches, les mêmes angles, les mêmes promesses ? » 3) « Le terrain n'est pas favorable pour vous à ce stade, s'il y a des centaines de concurrents. »
  - *Ex :* Cible débutant : « un produit entre stade 2 et stade 3. Assez validé pour que la demande existe, mais pas encore assez saturé pour que la bataille soit impossible à gagner. » Repère chiffré : « soyez sûr qu'il n'y ait pas 20 autres concurrents en France. Mais s'il y a genre 3 concurrents qui viennent juste de commencer, c'est totalement ok » (0 to 1 / 33 [03:32]).
- **Piège du décalage US → FR** — Ne pas copier le marketing US du PRÉSENT (product aware) sur un marché FR qui en est au stade unaware/problem aware.
  - *Ex :* « la façon dont on vendait le shilajit au début aux États-Unis, c'était la même façon dont il fallait le vendre en France. Or beaucoup d'e-commerçants avaient fait l'erreur de prendre le marketing du présent aux États-Unis, où les clients étaient déjà aware du produit… ils parlaient que d'offres, que de prix… et ils n'expliquaient pas l'histoire du shilajit » (0 to 1 / 33 [04:14]).
- **Source théorique** — Les deux concepts « viennent du même livre » : Breakthrough Advertising, recommandé et fourni en Google Doc dans la formation.
  - *Ex :* « deux concepts qui viennent de ce livre-là, Breakthrough Advertising… il se lit en une à deux heures » (0 to 1 / 33 [00:00] et [07:03]).

### Framework EPIC — les 4 quadrants psychologiques d'angles marketing
*Source : RESSOURCES NOTION / 24 — AI REVIEW MINING PROMPT (PROMPT 2), doc fourni mot pour mot ; épisode associé : CRÉATIVE INSIGHT / 38 Ep #23*

- **E – Emotional** — « Angles that trigger emotions, feelings, or empathy (love, comfort, fear, pride, nostalgia, joy). » Question : « What emotional desires or frustrations drive customers ? »
  - *Ex :* Phrase client : « I finally feel confident again. » → Emotion : Pride, relief → Angle : « The relief of feeling masculine and comfortable again. » → Hook : « This isn't just comfort — it's confidence. »
- **P – Practical** — « Angles that highlight solutions, functionality, or measurable benefits (results, relief, time-saving, comfort). » Question : « What concrete problems or functional improvements do they highlight ? »
  - *Ex :* Phrase client : « No more sweating at work. » → Relief, utility → Angle : « The ultimate breathable fabric for men. » → Hook : « Stay dry all day, no matter what. »
- **I – Identity** — « Angles that target self-image, belonging, and transformation (status, confidence, community). » Question : « What transformation or social perception does the customer aspire to ? »
  - *Ex :* Phrase client : « My girlfriend loves how it looks on me. » → Validation, status → Angle : « Become the man who looks good effortlessly. » → Hook : « The T-shirt that women can't stop stealing. »
- **C – Critical** — « Angles that trigger logical reasoning (proof, value, comparison, savings, evidence). » Question : « What rational or comparative justifications are used to buy or trust the product ? »
  - *Ex :* Phrase client : « I tried Trueclassic, but this one lasts longer. » → Logic, comparison → Angle : « Superior quality without the luxury markup. » → Hook : « Better than designer brands — for half the price. »

### Les 9 catégories du rapport de review mining (ce qu'on extrait des avis)
*Source : RESSOURCES NOTION / 24 — AI REVIEW MINING PROMPT (PROMPT 1), texte intégral du prompt fourni dans le corpus*

- **Product › Main Unique Value Propositions** — « What are the main reasons why people purchased this product? (benefits/advantages) »
  - *Ex :* Exemple corpus (leçon 08) : « c'est quoi son rêve : c'est des cheveux plus sains sans frisottis, réduire les rides de la peau, améliorer la qualité de sommeil » (08 [10:58]).
- **Product › Unique Features / Benefits** — « What are the unique selling points this product has over its' competitors? »
  - *Ex :* Taie d'oreiller : « un tissu 100% soie de mûrier de qualité supérieure face à des alternatives en polyester » (08, lexique + [14:24]).
- **Customer › Pain Points** — « What are the most significant or frequently mentioned challenges or issues that customers sought to address or alleviate using this product? »
  - *Ex :* « qui se lève avec des cheveux secs, frisés » (08 [24:29]).
- **Customer › Desired Outcomes** — « What are the most commonly expressed goals or desired results that customers expected or hoped to achieve when purchasing this product? »
  - *Ex :* « ces cheveux sont même plus, ils se réveillent sans frisottis, toujours doux » (avis Amazon lu en 08 [05:45]).
- **Customer › Purchase Prompts** — « What specific events or triggers led customers to consider purchasing this product? What influenced their decision to explore or invest in it? »
  - *Ex :* Non détaillé au-delà du prompt dans le corpus.
- **Customer › Misconceptions** — « What misconceptions or misunderstandings did customers have about the product or brand before their experience with it? What false beliefs or assumptions have they come to realize are not true? »
  - *Ex :* « est-ce que c'est vraiment du satin ? » (objection/misconception citée en 08 [13:37]).
- **Customer › Failed Solutions** — « What alternative solutions or approaches have customers previously attempted but found ineffective or unsatisfactory in addressing their needs? »
  - *Ex :* Base directe du discrédit solution aware : pilules, brosses, casquettes, greffes (03 [04:51], 05 [04:37]).
- **Customer › Objections** — « Why did customers initially doubt or question whether this product would work for them? What concerns or reservations did they have? »
  - *Ex :* « si par exemple ils ont une objection c'est trop cher parce que peut-être ils pensent que la soie c'est cher, ben ils vont pas cliquer sur vos ads » (08 [12:45]).
- **Contrainte d'entrée** — « For this to work effectively, it's important you provide chat GPT with at least 50 of both positive and negative reviews. » Outils cités : Chat GPT, Octane AI ou Reviews AI.
  - *Ex :* Sortie attendue : « You can then use this information to create angles, creatives, and messaging to directly address what people are identifying here. »

### Les 5 personas psychologiques présents dans TOUTES les audiences (approche psychologique ≠ avatar)
*Source : RESSOURCES NOTION / 41 — Quick Win : changer l'approche psychologique de ton ad + CRÉATIVE INSIGHT / 05 Ep #57 [00:00]→[12:05]*

- **A — Le Résigné** — « Conscient du problème depuis des années. Il a essayé 3 trucs. Rien n'a marché. Il est FATIGUÉ. → Il veut de la validation, pas de l'espoir. "C'est pas ta faute." » En audio : « lui il veut valider pourquoi tout ce qu'il a testé ça n'a pas marché. Si vous vendez de l'espoir à lui ça va pas marcher » (Ep #57 [01:52]). Ton : posé, empathique, aucune promesse magique. Zone : FATIGUE.
  - *Ex :* Hook : « Si t'as essayé Minoxidil, biotine, greffes et rien n'a marché. C'est peut-être pas ta faute. »
- **B — L'Aspirationnel** — « Jeune, pas vraiment le problème. Il achète la transformation, pas la solution. → Il veut du RÊVE, du before/after, du glow-up. » Ton : transformation, énergie haute. Zone : JOIE.
  - *Ex :* Hook : « Ce mec a rasé son crâne à 22 ans. Regarde-le 8 mois plus tard. »
- **C — L'Anxieux latent** — « Il sent que quelque chose cloche. Il n'a pas mis de mot. Il flippe. → Il veut qu'on NOMME son problème pour lui. » Ton : urgent, explicatif, nomme le mécanisme caché ; on peut introduire une figure d'autorité (médecin) pour rassurer (Ep #57 [09:21]). Zone : PANIQUE.
  - *Ex :* Hook : « Tu remarques plus de cheveux dans ton lavabo depuis 3 mois ? Voici ce qui se passe vraiment. »
- **D — Le Confortable** — « Sa vie va bien. Il achète les trucs qui l'améliorent sans drama. → Il veut du "casual upgrade", zéro pression. » Ton : chill, social proof, aucune pression. Passe mieux sur des personas aisés. Zone : COZY.
  - *Ex :* Hook : « Le shampoing que 40% des New-Yorkais 30+ utilisent chaque matin. »
- **E — L'Anti-pub** — « Il a vu 1000 ads cette semaine. Il scroll en 0.3s tout ce qui crie. → Il veut du CONTENU brut, pas de la pub. UGC POV, format organique. » Ton : zéro pub, contenu brut, « ugly ads » (Ep #57 [04:12]). Zone : COZY.
  - *Ex :* Format : « POV d'un mec qui filme lui-même son shampoing dans sa douche. "Les gars regardez ce que ma copine m'a offert." »

### Matrice Mood × Intensité (les 4 zones d'attaque émotionnelle)
*Source : RESSOURCES NOTION / 41 — Quick Win, tableau fourni ; CRÉATIVE INSIGHT / 05 Ep #57 [05:27]→[07:05]*

- **PANIQUE = Mood négatif + Intensité HAUTE** — Persona C. Émotions négatives fortes : panique, peur.
  - *Ex :* « attention tu perds tes cheveux, tu risques de plus plaire aux femmes » (Ep #57 [05:48]).
- **JOIE = Mood positif + Intensité HAUTE** — Persona B. Émotions positives hautes : joie, amour, paix.
  - *Ex :* Before/after, transformation, euphorie.
- **FATIGUE = Mood négatif + Intensité BASSE** — Persona A. Émotions négatives basses.
  - *Ex :* « C'est peut-être pas ta faute. »
- **COZY = Mood positif + Intensité BASSE** — Personas D + E. Émotions positives basses : acceptance, courage, désir.
  - *Ex :* « Le shampoing que 40% des New-Yorkais 30+ utilisent chaque matin. »
- **Règle d'usage** — Le mood se joue AU DÉBUT de la vidéo / sur la statique : « c'est plus au niveau de l'approche de votre ad en termes de début de la vidéo… c'est ça qui va venir captiver certains types de personnes » (Ep #57 [06:13]). Dans une VSL longue, on peut alterner : négatif → positif → négatif → positif.
  - *Ex :* « on peut commencer : attention tu perds tes cheveux… et ensuite montrer qu'il y a un espoir, il y a une nouvelle molécule qui permet de retrouver des cheveux naturellement » (Ep #57 [05:48]).

### Matrice Awareness × Hook Zone (quelle zone émotionnelle marche à quel stage)
*Source : RESSOURCES NOTION / 41 — Quick Win, tableau fourni mot pour mot ; commenté en CRÉATIVE INSIGHT / 05 Ep #57 [07:30]→[08:40]*

- **Unaware** — COZY = « trop tôt » ; JOY = « pas de raison » ; FATIGUE = « crée le problème » ; PANIC = « shock awake ».
  - *Ex :* « s'il est très unaware, si on est sur du cosy, c'est-à-dire positif de la joie, ça va venir moins impacter la personne… en général on commence avec de la fatigue, de la panique » (Ep #57 [07:30]).
- **Problem-Aware** — COZY = « mismatch de ton » ; JOY = « prématuré » ; FATIGUE = « commisération » ; PANIC = « escalation ».
  - *Ex :* « sur du problem aware, pareil, on est sur des émotions négatives » (Ep #57 [07:56]).
- **Solution-Aware** — COZY = « intro douce » ; JOY = « la solution existe » ; FATIGUE = « redondant » ; PANIC = « manipulateur ».
  - *Ex :* « si je discrédite de manière trop négative les solutions… ça fait manipulateur » (Ep #57 [08:17]).
- **Product-Aware** — COZY = « founder story » ; JOY = « transformation » ; FATIGUE = « crash de mood » ; PANIC = « tue la confiance ».
  - *Ex :* —
- **Most-Aware** — COZY = « rassure » ; JOY = « push final » ; FATIGUE = « buzzkill » ; PANIC = « mauvais moment ».
  - *Ex :* —

### Personas comportementaux (construits sur le comportement, pas la démographie) + angle + créateur associé
*Source : RESSOURCES NOTION / 20 — Comment créer 108 ads qui convertissent (étapes 2, 3, 5) ; épisode CRÉATIVE INSIGHT / 33 Ep #35*

- **Règle de construction** — « On ne construit pas des personas basés sur l'âge ou le métier. On construit des personas basés sur : ce que les gens disent ; ce qu'ils ressentent ; comment ils prennent leurs décisions. Chaque groupe de comportements similaires devient un persona. »
  - *Ex :* Inputs : avis clients, commentaires TikTok / feedback UGC, messages SAV → « On ne cherche pas des chiffres. On cherche des patterns humains. → tout mettre dans un google sheet »
- **Le sceptique** — Angle : « Tu mènes avec des preuves, de la crédibilité, de la répétition. » Créateur : « Créateurs avec autorité : fondateur, expert, testeur crédible. »
  - *Ex :* Hook : « Je pensais que c'était une arnaque… jusqu'à ce que je teste. » / « Je pensais que cette marque était bidon… jusqu'à ce que j'essaye. »
- **L'acheteur pressé** — Cité dans la liste des personas comportementaux.
  - *Ex :* Pas d'angle ni de créateur détaillé dans le corpus pour ce persona.
- **L'aspirationnel** — Angle : « Tu mènes avec le résultat, le style de vie, l'image de soi. » Créateur : « Créateurs aspirationnels : lifestyle, esthétique, image. »
  - *Ex :* —
- **Le "pain-aware" (douleur consciente)** — Angle : « Tu mènes avec le problème, la frustration, le soulagement. » Créateur : « Créateurs empathiques : témoignage, vécu, proximité. »
  - *Ex :* « Le même script joué par la mauvaise personne = crédibilité détruite. »
- **Le système de volume** — « 3 angles par persona / 4 hooks par angle / 3 formats par hook → 3 personas × 3 angles × 4 hooks × 3 formats = 108 publicités uniques. » Objectif technique : « Chaque pub est suffisamment différente visuellement pour éviter le regroupement "Entity ID" de Meta. »
  - *Ex :* « L'angle est le fil émotionnel de la publicité. C'est la porte d'entrée dans la conversation déjà présente dans la tête de ce persona. »

### La formule de diversification créative (angle × avatar × awareness × concept)
*Source : RESSOURCES NOTION / 26 — Creative Strategy Playbook cheat Sheet + CRÉATIVE INSIGHT / 42 Ep #27 — Creative Diversification [01:16]→[05:15]*

- **Formule officielle** — « (Message/angle × (Avatar* × Awareness)) × Concept) × Coherence Index ». « En suivant cette fiche, vous pouvez garantir une diversification créative. »
  - *Ex :* « Vous avez un même avatar, ça peut être Paul qui a 30 ans et qui est sportif mais qui connaît le produit, ou ça peut être Paul qui a 30 ans, qui est sportif mais qui ne connaît pas encore le produit, qui ne sait même pas encore qu'il a un problème de hanche » (Ep #27 [01:37]).
- **Axe Message** — Human-focused : Motivations & Challenges / Emotional Triggers / Relatable Scenarios. Brand & Product-focused : Functional Benefits / Emotional Benefits / Product Differentiation / Proof Points. Promotion-focused : Limited-time Offers / Seasonal Campaigns / Event-driven Messaging.
  - *Ex :* Pour Paul (problème de pied, sportif) : « tu portes des mauvaises chaussures » ; s'il n'est pas aware : « si tu ne performes pas, c'est peut-être qu'il y a un problème avec tes semelles » (Ep #27 [01:57]).
- **Axe Media Formats** — Core : Static Images, Short-form Video, Carousels, Collection Ads, Single Image with CTA. Extended : Shop Ads, Product Tagging, Messaging Ads, Instant Experience. Ratios : 1:1, 4:5, 9:16, Carrousel* (HACK).
  - *Ex :* Hack carrousel : « vous pouvez reprendre deux winning ads et les remettre en carousel et ça sera nouveau pour Meta » (Ep #27 [05:15]).
- **Axe Creative Approach (Concept)** — Lo-Fi : Creator-led Content / Reels-TikTok-style Language / User-generated Content. Hi-Fi (Polished) : Product-focused Storytelling / Lifestyle-driven Visuals / Motion Graphics & Animation. Other : Fully Animated Stories.
  - *Ex :* « comment on va venir faire véhiculer le message : en UGC avec peut-être un gars qui ressemble à Paul, ou peut-être en statique avec un dessin » (Ep #27 [02:18]).
- **Axe Placement** — FB & IG : Feed, Stories, Reels, Search, In-stream Video. Audience Network : Native Ads, Banner Ads, Rewarded Ads.
  - *Ex :* Organisation Meta recommandée : « dans nos ad sets, on crée presque des ad sets par awareness… comme ça on va venir toucher les gens qui sont cold, middle of funnel, bottom of funnel » (Ep #27 [04:11]).
- **Best Practices de la cheat sheet** — « Highlight brand in first 3 seconds ; Strong hook ; People using the product ; Strong CTAs ; Short videos ; Static + video ; Vertical + other ratios ; Designed for sound off ; Overlays for catalog ads. »
  - *Ex :* Garde-fou : « il va falloir s'assurer que cette diversité est de qualité… si vous commencez à lancer beaucoup de volume avec des b-rolls qui ne sont pas bonnes, Meta va vous flag » (Ep #27 [06:17]).

### Structure de l'ad Problem Aware (squelette section par section)
*Source : MASTER ACQUISITION / 04 — Les différents niveaux de conscience #3, [01:56]→[06:25]*

- **1. Parler du problème en expert** — Ne pas se contenter de nommer le problème : « vous allez venir parler de la perte de cheveux comme si vous étiez un expert » ; donner des chiffres, une population touchée, un terme médical. Effet visé : « ok, mais c'est exactement ça que je vis » + crédibilité.
  - *Ex :* « la perte de cheveux touche 80% de la population depuis 40 ans » ; « c'est une maladie qui touche principalement les gens qui sont en surpoids » (04 [02:20]).
- **2. Mécaniser le problème** — « vous allez venir expliquer pourquoi ils perdent des cheveux d'une manière scientifique » — nommer la cause interne. Vous pouvez faire parler un médecin dans l'ad (04 [02:46]).
  - *Ex :* « c'est une maladie dégénérative qui touche les personnes parce qu'ils ont un problème de circulation du sang dans le crâne » (04 [03:29]).
- **3. Appuyer / amplifier la douleur** — « il va falloir un peu remuer ce problème… vous allez venir appuyer les douleurs au quotidien. Le but, c'est que vraiment les petites douleurs au quotidien deviennent grosses », y compris la projection du pire.
  - *Ex :* « pour les femmes, c'est une perte de féminité. Ça peut être très difficile de trouver un conjoint. On ne se sent pas à l'aise dans son corps. Chaque fois qu'on se regarde dans le miroir, on s'en veut » ; « si vous ne faites rien, ça peut être pire. Vous pouvez même être chauve et porter des perruques » (04 [04:16]–[04:59]).
- **4. Introduire la solution comme inévitable** — « on va venir introduire la solution comme inévitable. Si vous êtes à ce stade-là, c'est peut-être que ça va être trop tard. Donc vous devez absolument faire quelque chose. »
  - *Ex :* « vous devez absolument restimuler la circulation sanguine dans votre crâne » (04 [05:20]).
- **5. Nommer le mécanisme unique de la solution** — « vous venez nommer l'unique mécanisme de la solution qui est l'inverse de la mécanisation du problème » ; on peut le montrer en 3D.
  - *Ex :* « le meilleur moyen pour ça, c'est un shampoing qui permet de naturellement réactiver la circulation sanguine, vous mécanisez avec du 3D » (04 [05:41]–[06:04]).
- **6. Introduire le produit + social proof** — « vous allez venir dire : ce shampoing-là est le shampoing le plus en vogue, vous allez montrer des exemples de social proof, comment ça a marché, des avant-après subtils. »
  - *Ex :* 04 [06:04].
- **7. (option) Rajouter des couches** — « vous pouvez rajouter des couches dans votre problem aware, ou si vous avez des ads qui discréditent les autres produits, les autres solutions, vous allez reprendre ces ads-là et rajouter des couches avant pour parler du problème. » Longueur variable — « Le but, c'est de varier, c'est d'avoir la diversité. »
  - *Ex :* 04 [06:25]–[06:46].

### Structure du script « Discredit » (Product Aware) — bloc par bloc, script fourni mot pour mot
*Source : RESSOURCES NOTION / 14 — DISCREDIT (script EN intégral) + CRÉATIVE INSIGHT / 26 Ep #36 [00:00]→[11:00]. Concept : « UGC, raw / VO naturel / B-Roll naturel, iPhone »*

- **HOOK (Pattern Interrupt)** — « Stopper le scroll immédiatement avec une phrase choc et inattendue. + target product aware »
  - *Ex :* « Don't buy the Space Buddy. » Variante marque : « [Marque] est un scam, je vais vous expliquer pourquoi » (Ep #36 [03:18]).
- **CONTEXT + VIRALITY (Familiarity Proof)** — « Créer un effet de reconnaissance et montrer que le produit est populaire. » Technique du premier « oui ».
  - *Ex :* « Now, you've probably seen this little astronaut all over the internet on TikTok, on Amazon, on Google, and a bunch of places. »
- **WARNING + TRUST (I'm protecting you)** — « Installer la confiance en se positionnant comme quelqu'un qui protège le spectateur d'une erreur + garder l'attention »
  - *Ex :* « And if you're thinking of buying one, watch this before you buy because I've been scammed before, and I don't want you to make the same mistake. »
- **PROBLEM (Original vs Knockoffs)** — « Introduire le vrai problème : le marché est rempli de copies. » C'est la « technique du diagnostic » (Ep #36 [05:14]).
  - *Ex :* « Now, there's the original Space Buddy, and then there's a bunch of cheap knockoffs. »
- **UNCERTAINTY (You can't tell)** — « Créer du doute et rendre le spectateur dépendant de ton explication. »
  - *Ex :* « Now, even if you buy the knockoff, you might not notice because you don't know what the original looks like. »
- **AUTHORITY + PROOF SETUP (I have both)** — « Asseoir l'autorité en montrant que tu as comparé les deux versions. »
  - *Ex :* « But I have both, and let me tell you, the difference is crazy. »
- **DEMONSTRATION (Show the knockoff) / (Show the original)** — « Identifier clairement la mauvaise version visuellement » puis « Créer un contraste immédiat avec la vraie version ». Dans les deux cas : « → Top bénéfice émotionnel, ou technique ». Se positionner sur le PREMIER angle du produit uniquement (Ep #36 [06:38]).
  - *Ex :* « This is a knockoff. » / « Now, here's the original. »
- **QUANTIFIED DIFFERENCE (Specific claim)** — « Rendre la supériorité tangible avec un bénéfice mesurable. » Il faut « une différence no-brainer » (Ep #36 [06:59]).
  - *Ex :* « Do you notice the original is about three times brighter? »
- **UNIQUE MECHANISM (Why it's better)** — « Donner une raison logique et crédible à la supériorité du produit. »
  - *Ex :* « That's because they're using a patented LED technology owned by Plushy. » Version genou : « une vraie LED light therapy certifiée, brevetée » (Ep #36 [07:19]).
- **VILLAIN MECHANISM (Why knockoffs suck)** — « Créer un "méchant" responsable de la mauvaise qualité. » = l'inverse exact de votre mécanisme.
  - *Ex :* « And the knockoffs use some cheap Chinese light. »
- **PERMISSION / SOFT DISQUALIFIER (Reverse psychology)** — « Réduire la pression de vente et rendre le choix premium plus désirable. » À adapter si votre produit n'est pas le plus cher (Ep #36 [08:49]).
  - *Ex :* « So, if you want to save money and get a lower quality product, that's completely fine. »
- **EMOTIONAL REASON (Gift identity)** — « Passer de la logique à l'émotion et à l'identité personnelle. » → C'est ICI qu'on injecte la raison d'achat de VOTRE avatar.
  - *Ex :* « But for me, I know I want to give the best gift this year, so I'll stick with the original. » Version genou : « pour moi qui veux vite pouvoir remarcher, je vais prendre l'original » (Ep #36 [09:33]).
- **CTA + WHERE TO BUY (Source control) / SCARCITY OF SOURCE** — « Diriger clairement vers l'action et associer l'original à la marque » puis « Éviter les copies des marketplaces et pousser à acheter via la source officielle. »
  - *Ex :* « Anyways, just wanted to let you guys know, if you want the original, get it from Plushy. » / « It's only available on their website at … »

### Framework générique par stage de conscience (résumé donné en fin de module)
*Source : MASTER ACQUISITION / 05 — Les différents niveaux de conscience #4, [09:04]→[09:52]. Les slides « frameworks selon les 5 stages de marché » sont annoncées comme bonus.*

- **Séquence énoncée** — « Le hook, par exemple : petit "trois raisons". Ensuite on est dans le conscient, discrédit. Ensuite la solution. Ensuite on build hype. Ensuite l'offre. Ensuite le testimonial, social proof, etc. » (transcription : « ensuite on outworks » = l'offre / la partie offre).
  - *Ex :* « Vous aurez ici des exemples au niveau du stage de prospects, de quel framework utiliser… vous aurez les cinq niveaux en cinq stages de marché ici. »
- **Usage IA recommandé** — « vous pouvez même très bien l'exporter avec ChatGPT et lui dire : ok reprends ce framework-là, reprends cette ad-là, et convertis-le-moi pour mon produit. »
  - *Ex :* 05 [09:52].

### Débloquer de nouveaux avatars par l'ethnie (TAM par marché)
*Source : CRÉATIVE INSIGHT / 07 Ep #59 — Débloquer de nouveaux avatars et ethnies [00:00]→[07:50]*

- **USA** — Ethnies à tester : « les Hispaniques, les Afro-Américains, les Asiatiques » (+ White Middle Aged donné en exemple d'avatar t-shirt homme 45+).
  - *Ex :* « il a juste fait ça avec une nouvelle ethnie sur le marché US et il est passé de 2 chiffres à 4 chiffres [par jour] parce que vous pouvez débloquer un total nouveau marché » (Ep #59 [00:23]).
- **France** — « la population Maghrébine, Antilles, Sub-Saharien ».
  - *Ex :* « en France, les Maghrébines, les Marocaines etc., ça marche très très bien pour tout ce qui est beauté » (MASTER ACQUISITION / 08 [22:30]).
- **Allemagne** — « Turkish German, Arabes German, Eastern Europe ».
  - *Ex :* —
- **UK** — « British, Pakistanis, British Black, British Bangladesh, avec aussi les Polonais ».
  - *Ex :* —
- **Process (étapes 0 → 5)** — Étape 0 : évaluer le TAM des ethnies pour votre produit (avec Claude/GPT) et retenir les 2-3 premières. 1 : adapter la landing page / advertorial — « vous allez venir changer chaque main, chaque visage… garder la même image mais changer la personne » + adapter les noms dans les reviews. 2 : reprendre le TOP 5 des winning ads et changer visages et mains (face swap IA ou refaire les b-rolls). 3 (optionnel) : « créer deux hooks additionnels plus précis par rapport à l'avatar ». 4 : reprendre les top statiques « où l'on voit de la peau ou un visage » + headlines spécifiques à l'avatar (demander à Claude « par rapport à mon avatar, quel verbatim il pourrait utiliser »). 5 : injecter dans une CBO existante + créer une nouvelle CBO dédiée (ad set statiques / ad set vidéos).
  - *Ex :* Volume cité : « là vous auriez à peu près 15 ads… si vous faites les 3 variations. Et là 15 ads aussi, ce serait bien. »
- **Règles de cohérence** — « on ne reprend jamais des winning ads à zéro » ; « vous changez uniquement les visages, reviews et headlines. Tout le reste reste identique » ; « ça ne doit pas faire IA », la qualité doit rester identique ; voix off avec accent = « encore plus congruent » ; villes cohérentes ; environnement neutre / universellement urbain.
  - *Ex :* « pensez à avoir des cities cohérentes. Par exemple Miami pour Latino, pas Cleveland » ; hook adapté : « le t-shirt pour le dad bod » → version hispanique « pour el papi » (Ep #59 [04:20]).

### La méthode en 4 phases / 12 questions (creative strategy)
*Source : RESSOURCES NOTION / 42 et 07 — La méthode en 4 phases et 12 questions ; épisodes CRÉATIVE INSIGHT / 10 Ep #54 et 11 Ep #55*

- **PHASE 1 — RECHERCHE (Q1 QUAND, Q2 POURQUOI, Q3 QUI)** — Q1 : « Quand est-ce que ta cible ressent réellement le problème ? Le micro-moment exact (pas la situation générale)… c'est exactement là que tes meilleurs hooks vivent. » Q2 : « Pourquoi elle le ressent ? L'émotion sous-jacente qui va driver le ton de tes scripts. » Q3 : « Qui tu attires ? Pas tes avatars en silos. Les similarités que tout ton TAM partage. C'est là que tu trouves les angles broad qui scalent. » Sources : « Reviews. Surveys. Customer interviews. Social listening. Commentaire sous les ads. Reddit. »
  - *Ex :* Liquid Death : « Il cherchait pas "qu'est-ce que les gens disent sur l'eau ?". Il cherchait "quand est-ce que les rebelles non-buveurs se sentent gênés de tenir une bouteille d'Evian dans un bar ?" … Insight : ils ont pas cherché un avatar démographique. Ils ont cherché un moment d'inconfort social. »
- **PHASE 2 — IDÉATION (Q4 QUEL problème, Q5 QUEL format, Q6 OÙ)** — Q4 : « quel problème est le plus sous-servi et le plus susceptible d'imprimer maintenant ? » Q5 : « Static, GIF, UGC, vidéo pro ? Le format suit le message, pas la trend. » Q6 : « Mappe à la phase d'achat : trigger → exploration → évaluation → achat. »
  - *Ex :* Allbirds : problème sous-servi = « Tous les sneakers sont moches, complexes et inconfortables au quotidien » → « statics minimalistes avec une seule sneaker sur fond blanc + caption "The world's most comfortable shoes" ».
- **PHASE 3 — CONCEPT DEVELOPMENT (Q7 COMMENT, Q8 QUEL type, Q9 QUELLE plateforme)** — Q7 : structure narrative — « Hero's Journey (le voyage du héros) ; Pyramide de Freytag (montée de tension classique) ; In medias res (commencer en plein milieu de l'action). La séquence compte plus que le contenu lui-même. » Q8 : « POV text overlay, mashup, "3 raisons pour lesquelles", talking head ? Le type doit servir l'histoire. » Q9 : « Designe pour la plateforme où tu fais de la pub. Cross-poster en aveugle = mort. »
  - *Ex :* « Un "POV text overlay" peut imprimer beaucoup mieux qu'un mashup complet ou qu'un "3 raisons pour lesquelles". »
- **PHASE 4 — PRODUCTION (Q10 QUI, Q11 COMBIEN de temps, Q12 QUELLES métriques)** — Q10 : qui build l'ad (déjà tranché par format+plateforme). Q11 : « Mets des paramètres serrés. "Vidéo + b-roll dans 4 jours." Et tiens-toi à la deadline. » Q12 : « Le hook rate te dit quelque chose de complètement différent du CPA. Définis le success AVANT le launch. »
  - *Ex :* Post-launch : « Ça a marché ? Oui → tu itères. Non → tu retournes en Phase 1 (Recherche)… "Est-ce qu'on a trouvé le mauvais insight, ou est-ce qu'on l'a juste mal lu ?" »

### Les 21 frameworks de headlines déclinés par niveau de conscience (chaque formule contient [Mechanism])
*Source : RESSOURCES NOTION / 33 — 190 Psychological Hooks based on the 21 Proven Frameworks for Winning Headlines. Chaque framework est décliné en 5 blocs : Most Aware, Product Aware, Solution Aware, Problem Aware, Unaware. C'est le seul endroit du corpus où hooks et awareness sont explicitement croisés.*

- **1. Fast and Specific Results** — « Achieve [Desire] in just [Timeframe] with [Opportunity] – made possible only by [Mechanism]. »
  - *Ex :* Most Aware : « Flawless skin in 7 days – trusted by thousands for proven results. » / Unaware : « Cut work hours by 5 every week with smarter task management tools. »
- **2. Unique Solution to a Frustrating Problem** — « Say goodbye to [Pain Point] with the only [Opportunity] that turns [Desire] into reality: [Mechanism]. »
  - *Ex :* Solution Aware : « No more energy crashes – powered naturally, without caffeine. »
- **3. Unexpected Novelty** — « [Opportunity] is a brand-new way to [Desire], and it works thanks to [Mechanism]. »
  - *Ex :* Product Aware : « Sleep cool, wake refreshed – the revolutionary mattress topper. »
- **4. A Bold Promise** — « You've never seen [Desire] like this before – discover [Opportunity] and how [Mechanism] changes everything. »
  - *Ex :* Problem Aware : « Chronic pain relief, reimagined – target the root cause today. »
- **5. Urgency + Reward** — « You need to try [Opportunity] before it's too late to [Desire]. Only [Mechanism] makes it possible. »
  - *Ex :* Most Aware : « Comfort that won't last – order now before stock runs out. »
- **6. Transformational Desire** — « Go from [State A] to [State B] with [Opportunity], the only way made possible by [Mechanism]. »
  - *Ex :* Most Aware : « Irritation to comfort – anti-friction wear that works all day. »
- **7. Challenge the Doubt** — « Think [Desire] is impossible? Try [Opportunity], and see how [Mechanism] proves it isn't. »
  - *Ex :* —
- **8. Blame and Liberation** — « It's not your fault that [Pain Point]. [Opportunity] uses [Mechanism] to help you finally achieve [Desire]. »
  - *Ex :* Recoupe exactement le persona A (Le Résigné) : « C'est peut-être pas ta faute. »
- **9. Exciting Change** — « Ready for a better way to [Desire]? [Opportunity] is the only method that uses [Mechanism] to get you there. »
  - *Ex :* —
- **10. Irresistible Offer** — « Imagine achieving [Desire] without [Pain Point]. With [Opportunity], powered by [Mechanism], it's finally possible. »
  - *Ex :* Product Aware : « Lose weight without starving – smarter hunger-blocking strategies. »
- **11. Measure the Size of the Claim** — « [Action] [Product] to achieve [Specific Outcome]. »
  - *Ex :* Most Aware : « Burn 500 calories a day – effortless results proven by thousands. »
- **12. Measure the Speed of the Claim** — « [How-To] [Action] with [Product] in [Timeframe]. »
  - *Ex :* « How to brew barista-quality coffee in minutes – effortless perfection every time. »
- **13. Use an Authority** — « I [Authority Action] with [Product] and discovered [Big Insight]. »
  - *Ex :* Most Aware : « I thought fast charging was a gimmick – until I tried this. »
- **14. Before and After** — « Before [Problem], I used [Product], and now [Outcome]. »
  - *Ex :* « Before advanced charging, my phone was always dead – now, I'm always powered. »
- **15. Compare the Claim to Its Rival** — « [Product] works [Speed/Effectiveness] compared to [Competitor/Rival Method]. »
  - *Ex :* « Automated coffee systems outperform regular machines in consistency. »
- **16. Remove Limitations from the Claim** — « How to [Action] with [Product] even if [Limitation]. »
  - *Ex :* « How to charge faster – even if your phone is outdated. »
- **17. State the Claim as a Question** — « Who else wants to [Desire] with [Product] without [Pain]? »
  - *Ex :* « Who else wants reliable charging without extra cables? »
- **18. Offer Information in the Claim** — « [How-To] [Action] with [Product] in [Timeframe]. »
  - *Ex :* « How to charge 3x faster in just 15 minutes. »
- **19. Stress the Newness of the Claim** — « NEW: [Product] helps [Action] like never before. »
  - *Ex :* « NEW: Charging solutions work faster than you've ever seen. »
- **20. Stress the Exclusiveness of the Claim** — « The only [Product] that [Action]. »
  - *Ex :* Solution Aware : « The only posture device backed by leading chiropractors. » / Unaware : « The only charger that works through thick phone cases. »
- **21. Challenge Your Prospect's Beliefs** — « I thought [Belief], but then [Product] proved [Result]. »
  - *Ex :* Solution Aware : « I thought posture braces were gimmicks, but this one worked. » / Unaware : « I thought fast charging was a myth, but this solution delivered every time. »

### Le process d'analyse marketing (méthode « fast », de la data brute aux angles)
*Source : MASTER ACQUISITION / 08 — Analyse Marketing [00:00]→[29:22]*

- **Étape 1 — Extraire les avis Amazon des concurrents** — « les avis Amazon c'est de la pépite parce que souvent c'est pas fake et ils sont très fournis » (08 [03:21]). Outil : Amazon Scraper — « quand je clique ça va venir me télécharger toute la fiche Amazon : les vidéos, les images, et ce qui m'intéresse, les avis » puis export CSV pour nourrir ChatGPT (08 [05:00]). Prérequis : avoir des concurrents — « si vous n'avez pas de compétiteurs… c'est mort, je vous déconseille de le faire » (08 [02:36]).
  - *Ex :* Produit étudié : taies d'oreiller en soie de mûrier ; lecture manuelle des avis → « les cheveux ça ressort très très souvent… donc les gens n'achètent pas pour mieux dormir, ils achètent principalement pour des vertus de beauté » (08 [07:17]).
- **Étape 2 — Copier la landing page du concurrent** — « On va venir copier la landing page… la landing page qu'on a trouvée » (08 [07:43]). Elle est donnée en input à ChatGPT en même temps que les avis.
  - *Ex :* 08 [10:30] : « je juste redonnais le prompt, j'ai oublié de coller le compétiteur ».
- **Étape 3 — GigaBrain (l'avis collectif des forums)** — « c'est un outil qui va regrouper tous les forums et vous donne un compte rendu de tous les forums, ça vous évite de chercher tous les forums un à un » (08 [08:09]). On copie le résumé + les FAQ/questions. « on ne veut pas l'avis d'une personne, on veut l'avis collectif du produit, des bénéfices, des recommandations, et ensuite des questions » (08 [08:52]).
  - *Ex :* « je viens taper dans GigaBrain les termes reliés à notre produit… pillow + mulberry silk… il y a 180 commentaires par rapport à ça » (08 [08:31]).
- **Étape 4 — Le prompt d'analyse (partie 1) → le rapport** — Sorties attendues du prompt : Unique Selling Propositions / ce que le prospect veut ; impacts émotionnels ; objections ; unique mécanisme du problème et de la solution ; competitors' insights & weaknesses ; top advertising strategies & angles + messages ; puis personas.
  - *Ex :* Unique mécanisme du problème sorti par l'IA : « le coton absorbe l'huile et ça fait des cheveux secs, et le satin il est fait en polyester, ça cause de l'électricité statique » ; l'inverse = mulberry silk (08 [13:59]–[14:49]). Weaknesses concurrents : « fausses alternatives satin » et « expensive premium brands » sans justification marketing du prix (08 [14:49]–[15:37]).
- **Étape 5 — Le prompt « comment battre la compétition » (partie 2)** — 5 leviers sortis : « introduire une nouvelle solution » ; « prendre le levier sur l'unique mécanisme » ; « optimiser l'entonnoir publicitaire » ; « créer une proposition de valeur plus forte » ; « exploiter les faiblesses des concurrents ». Plus : VSL / vidéos plus longues, meilleur copywriting, agiter plus le problème, advertorials (« tips sur comment battre vos compétiteurs »).
  - *Ex :* « la nouvelle solution c'est : focus sur la transformation beauté, comparer le silk et le coton vs satin, sur le self-care, pas seulement better sleep » (08 [19:49]).
- **Étape 6 — Sondage clients (si vous avez une marque)** — « vous envoyez un form à tous vos clients et vous leur posez des questions : pourquoi vous avez acheté le produit, qu'est-ce que vous aimez chez le produit, à quoi ressemble votre produit de rêve, c'était quoi le problème que vous vouliez résoudre, quels résultats avec notre produit, quelle émotion vous avez ressentie » (08 [12:00]).
  - *Ex :* Complément Trustpilot : extension « Trustpilot Reviews Downloader » + export Amazon dans le même CSV (RESSOURCES NOTION / 29).
- **Étape 7 — Cartographier avatars × angles × messages** — « pour votre produit il y aura plusieurs avatars, donc un persona… ensuite pour ces avatars-là il va y avoir des angles marketing qui vont venir leur parler… et pour les mêmes angles marketing, différents messages » (08 [20:56]–[22:30]). Chaque angle a une taille de TAM différente : « ça va être un angle marketing énorme parce que ça va venir toucher beaucoup de personnes ; là ça va être un petit angle marketing qui marche aussi » (08 [21:42]).
  - *Ex :* Avatar : « Mireille qui a 45 ans, qui a la peau qui commence à rider, qui a aussi des problèmes de cheveux ». Angles : cheveux / peau (skin). Messages pour l'angle cheveux : « arrêter les frisottis » ou « lutter contre la perte de cheveux » (08 [21:20]–[22:30]).
- **Étape 8 — Batch de créas** — « statiques, vidéos, différents messages les plus prouvés, pour les trois avatars, pour les différents angles, et ça fait qu'on a un batch énorme de créatives à tester » (08 [26:13]–[26:59]).
  - *Ex :* Personas sortis par l'IA sur ce produit : « entre 22 et 40 ans, femme, qui se lève avec des cheveux secs, frisés » ; « le self-care advocate » ; « ça peut être aussi les hommes, ceux qui ont des allergies ou une peau sensible, qui ont de l'acné » (08 [24:29]–[25:26]).

### Règles sourcées
- Un produit ne meurt pas : c'est le message qui n'est plus aligné avec le stage de conscience. Avant d'écrire quoi que ce soit, on fixe le stage visé. (MASTER ACQUISITION / 02 — Les différents niveaux de conscience #1 [02:40] : « et ce n'est pas vos produits morts, c'est simplement votre message par rapport au stage et au niveau de conscience du marché n'est pas le bon »)
- La pyramide a deux axes : plus on monte (vers unaware) plus le marché est grand ET plus c'est difficile ; plus on descend (vers most aware) plus c'est simple ET plus le marché est petit. (MASTER ACQUISITION / 02 — Les différents niveaux de conscience #1 [01:09] : « Ça c'est la taille du marché, c'est-à-dire plus on monte, plus la taille du marché est énorme et ça c'est plus c'est simple, plus ça va être difficile. »)
- On doit couvrir TOUS les stages en parallèle, pas un seul. Un fichier de créas doit contenir des lignes pour chaque niveau de conscience. (MASTER ACQUISITION / 02 — Les différents niveaux de conscience #1 (repris en 05 [07:58] : « il faut avoir target, tous les étapes ici ») [03:25] : « nous ce qu'on veut en fait c'est à regarder toutes les parts du gâteau. On ne veut pas faire que ça, on veut le faire mais on ne veut pas manquer ces parts là »)
- Most aware : créative simple = produit + offre. Les deux seuls leviers sont le timing et la meilleure offre. Ne jamais arrêter d'en produire, même quand on travaille les stages hauts. (MASTER ACQUISITION / 03 — Les différents niveaux de conscience #2 [01:03] : « Donc là, pour gagner des facteurs importants, ça va être le timing et la meilleure offre... L'audience c'est très peu scalable, mais il ne faut pas oublier les targeter. »)
- Product aware : le prospect compare les MARQUES. Le message doit discréditer les marques concurrentes et prouver la supériorité (avantage unique, prix, mécanisme unique). (MASTER ACQUISITION / 03 — Les différents niveaux de conscience #2 [03:20] : « Parce que dans sa tête, lui sa préoccupation c'est lequel est le mieux. Et la meilleure moyen pour convaincre que le vôtre est le meilleur, c'est de discréditer les autres. »)
- Solution aware : on discrédite les autres SOLUTIONS (pas les autres marques). Formule à réutiliser telle quelle : « La plupart de ceux qui veulent [désir] utilisent [solution X]. Le problème avec ça, c'est que [X] ne résout pas [problème], ça masque seulement le problème. » (MASTER ACQUISITION / 03 — Les différents niveaux de conscience #2 [05:36] : « Donc là, il y a un hack que nous on fait et qui marche souvent, c'est qu'on met cet type de phrase-là. La plupart de ceux qui veulent en l'occurrence éviter de perdre [leurs cheveux], utilisent des pilules ou des brosses »)
- Le discrédit doit être argumenté, jamais gratuit : on explique POURQUOI l'autre solution n'est pas la meilleure (plus lente, plus d'inconfort, plus de risques, effets secondaires). (MASTER ACQUISITION / 03 — Les différents niveaux de conscience #2 [07:23] : « Idéalement, pas de bullshit. On va pas venir dire que c'est nul. On explique pourquoi. On explique que c'est pas la meilleure solution pour résoudre le problème. Ou d'une autre manière, c'est pas la solution qui va la pl »)
- Quatre axes universels d'argumentation pour n'importe quel angle : le plus simple, le plus rapide, le maximum de résultat, et 100% de chances que ça marche. (MASTER ACQUISITION / 03 — Les différents niveaux de conscience #2 [07:45] : « En gros, ce qui veut, pour vous comprendre votre prospect, c'est qu'il veut atteindre son désir de la manière la plus simple, la plus rapide et avoir le maximum et que cette solution marche à 100%. »)
- Problem aware : il faut MÉCANISER le problème, c'est-à-dire l'expliquer scientifiquement comme un expert / un médecin. C'est ce qui crée la crédibilité et fait dire au prospect « c'est exactement ça ». (MASTER ACQUISITION / 04 — Les différents niveaux de conscience #3 [03:29] : « donc mechaniser le problème, c'est-à-dire vous allez venir expliquer pourquoi ils perdent des cheveux d'une manière scientifique »)
- Problem aware : il faut amplifier les micro-douleurs quotidiennes jusqu'à ce qu'elles deviennent assez grosses pour déclencher l'action, y compris en projetant l'aggravation future. (MASTER ACQUISITION / 04 — Les différents niveaux de conscience #3 [04:37] : « Le but, c'est que vraiment que les petites douleurs au quotidien deviennent grosses. Parce que des petites douleurs, mais elles se sont tous les jours, ne font pas passer à l'action. En fait, il faut que ça soit gros. »)
- Le mécanisme unique de la solution s'écrit comme l'inverse exact de la mécanisation du problème. C'est la règle de fabrication d'un mécanisme. (MASTER ACQUISITION / 04 — Les différents niveaux de conscience #3 [05:41] : « Donc vous dites, en fait, vous venez nommé l'unique mécanisation de la solution qui est l'inverse de la mécanisation du problème. »)
- La créa doit montrer l'avatar réel (âge, corpulence, ethnie). Montrer un autre profil discrédite l'avatar et fait perdre le marché face à un concurrent qui, lui, le respecte. (MASTER ACQUISITION / 04 — Les différents niveaux de conscience #3 [07:08] : « Si votre avatar est principalement une femme plus de 40 ans et que vous faites de tout vos ads UGC avec des actrices 20 ans... moi je vais dire, ok, mon avatar c'est une dame de 45 ans qui est un peu en surpoids. Moi je  »)
- Unaware : format long / VSL qui commence très large par une histoire, puis introduit le problème, puis les couches suivantes. C'est le stage le plus scalable et le plus exigeant en montage et en copywriting. (MASTER ACQUISITION / 04 — Les différents niveaux de conscience #3 [10:00] : « mais un [unaware], en règle générale, on fait des VSL, c'est-à-dire on fait des longues vidéos de vente, c'est qu'on commence très large et ensuite on introduit le problème et après on fait les autres couches »)
- Le ciblage du niveau de conscience se joue AU DÉBUT de l'ad (le hook). C'est le hook qui décide quel stage on touche. (MASTER ACQUISITION / 05 — Les différents niveaux de conscience #4 [08:43] : « En règle générale c'est au début de l'ad qu'on targette. Donc c'est au début de l'ad que devait targeter vos... quel stage niveau de conscience vous les touchez. »)
- Pour couvrir les autres stages, on décline une ad winner en « couches » (retirer/ajouter le bloc problème, commencer par le discrédit, etc.) — mais on part TOUJOURS d'un concept déjà prouvé. (MASTER ACQUISITION / 05 — Les différents niveaux de conscience #4 [08:19] : « Et un moyen de le faire c'est que si vous avez une ad winneuse, de simplement venir rajouter des couches ici... Si vous avez une ad, c'est qu'il parle juste de l'offre. Ok, venez discréditer les autres produits. Venez di »)
- Sur un marché de sophistication 4-5 on ne se bat pas frontalement : on recrée un océan bleu par un mécanisme unique OU par un nouveau marché / nouvel avatar. (MASTER ACQUISITION / 02 — Les différents niveaux de conscience #1 [08:38] : « donc là ce que vous devez faire c'est essayer de retrouver un océan bleu, ça peut être avec un unique mécanisme, peut être avec un nouveau marché »)
- Recette d'invention d'un mécanisme : prendre un produit à très gros TAM déjà connu du marché, et lui greffer un mécanisme nouveau. (MASTER ACQUISITION / 08 — Analyse Marketing [17:39] : « c'est-à-dire vous trouvez un produit où c'est qu'il y a un gros TAM, total addressable market, par exemple les shampoings. Ok, prenez un shampoing qui a un nouveau mécanisme, ok, c'est un shampoing qui fait repousser les »)
- Ne pas confondre sophistication et awareness : la sophistication sert AVANT (choix du produit / du marché), l'awareness sert APRÈS (construction des créas). Un débutant vise un produit stade 2-3. (RESSOURCES GOOGLE / 05 — Sophistication simplifié (doc lié à 0 TO 1 MASTER ONE / 33) — : « Sophistication : vous l'utilisez avant de choisir votre produit. C'est votre filtre de sélection. Awareness : vous l'utilisez après, quand vous construisez vos publicités. [...] Ce que vous cherchez en tant que débutant  »)
- Une créa = UN angle unique + UN avatar. On n'empile pas les bénéfices : les autres bénéfices passent en secondaire. (MASTER ACQUISITION / 07 — Créer un Condor (Partie 2) [08:34] : « Et vous allez venir focus que sur un angle. Vous n'avez pas à venir [dire que le] shampoing [est] une meilleure solution pour avoir des cheveux robustes, pour sentir bon. Votre focus, c'est sur la perte de cheveux. Donc  »)
- Le batch se construit ainsi : 1 angle → 1 persona → N messages → N concepts (statique / vidéo / UGC). Une fois qu'un angle cartonne, on teste d'autres avatars et d'autres concepts SUR CET ANGLE. (MASTER ACQUISITION / 07 — Créer un Condor (Partie 2) [09:18] : « Idéalement, on va avoir différents concepts pour différents angles marketing avec les différents messages comme variation. Ça, ça vous fera un batch, c'est ce qu'on veut. [...] une fois qu'il y a un truc qui marche, cet  »)
- On part toujours de la data client réelle : avis Amazon des concurrents + landing page concurrente + GigaBrain. Sans concurrents à scraper, on ne lance pas le produit. Et les personas sortis par l'IA sont à prendre avec des pincettes (l'IA ne connaît pas vraiment les acheteurs). (MASTER ACQUISITION / 08 — Analyse Marketing (garde-fou personas en [24:06] : « faut toujours prendre avec des pincettes ce que ChatGPT nous donne en termes de persona ») [02:36] : « tout d'abord, on va devoir extraire la data, donc nous ce qu'on a besoin c'est [les] commentaires Amazon des compétiteurs. Si vous n'avez pas de compétiteurs, [si] vous lancez un produit [seul], c'est mort, je vous décon »)
- Les objections se traitent DANS L'ORDRE de force : la plus forte (souvent le prix) se traite dans l'ad elle-même, les suivantes sur le site. Sans réponse aux objections, pas de scaling (goulot d'étranglement). (MASTER ACQUISITION / 08 — Analyse Marketing [13:37] : « et après il faut répondre aux objections dans l'ordre. Donc en premier lieu il va se poser les objections les plus fortes normalement, donc c'est trop cher, ça va être déjà l'objection qui va être répondue dans l'ad »)
- Un angle très fort mérite son propre funnel dédié (landing page + upsell spécifiques), pas une LP générique qui parle de tous les angles. (MASTER ACQUISITION / 08 — Analyse Marketing [28:12] : « si vraiment il y a des angles marketing trop forts, vous avez créé des funnels distincts, c'est-à-dire un funnel c'est qu'il y a une landing page et des ads précis... et après peut-être un flow d'upsell spécial pour les  »)
- Ne jamais construire les angles uniquement à partir de ses propres clients : il faut analyser ce que pensent les PROSPECTS avant l'achat (Google, YouTube, TikTok, GigaBrain sur sa marque et celle des concurrents), sinon on rate des segments entiers. (CRÉATIVE INSIGHT / 47 — Ep #16 : Comprendre le prospect avant achat [01:06] : « il y a un énorme segment de personnes que vous n'allez jamais toucher si vous n'analysez pas, si vous ne faites pas une analyse d'avant l'achat, de qu'est-ce que votre prospect pense par rapport à une solution, par rappo »)
- Pour UN MÊME angle et UN MÊME avatar, il existe plusieurs approches psychologiques (les 5 personas A→E) : c'est ce qui débloque des poches d'audience de tailles très différentes. (CRÉATIVE INSIGHT / 05 — Ep #57 : Changer la psychologie de vos ads (doc RESSOURCES NOTION / 41) [04:37] : « Donc pour un même angle, par exemple pour refaire pousser les cheveux naturellement, il va y avoir plein d'approches psychologiques... le fait d'avoir plusieurs approches psychologiques va vous permettre de venir targete »)

**Absent du corpus** : MANQUANTS DANS LE CORPUS (à ne jamais combler au bon sens) : (1) La SOP « Frameworks selon le niveau de Conscience du marché » est listée au sommaire du Playbook Les Créatives (RESSOURCES NOTION / 35) mais son contenu n'est PAS dans le corpus ; on n'a que la description orale de la slide en 05 [09:26] (« hook 3 raisons → discrédit → solution → build hype → offre → testimonial/social proof ») et la mention que les frameworks « seront dans les bonus » (05 [09:04]). Il n'existe donc AUCUN tableau complet framework×stage vérifié. (2) Le prompt d'analyse marketing utilisé en leçon 08 (annoncé « à jour au 13 mars 2025 ») n'est PAS reproduit : la vidéo le montre à l'écran mais le corpus n'en contient pas le texte. Seuls sont disponibles mot pour mot : le AI REVIEW MINING PROMPT + le PROMPT 2 EPIC (notion/24) et le prompt AIDA sur avis clients (notion/29). (3) Le prompt « à copier-coller » des 5 personas psychologiques (notion/41) est absent : le document affiche « Chargement du code JavaScript… ». (4) Le « Master Prompt » de construction des personas (notion/20, étape 2) est cité mais son texte n'est pas fourni. (5) Le « Coherence Index » de la formule de diversification est nommé mais jamais défini ni chiffré — il renvoie à une masterclass/replay de mastermind non transcrite (Ep #27 [02:39]). (6) Il n'existe AUCUNE liste fermée et canonique de « types d'angles » : le corpus donne des grilles pour les classer (EPIC, 5 personas psychologiques, personas comportementaux) mais jamais une taxonomie officielle d'angles ; les angles se dérivent toujours de la data client. (7) Aucun seuil chiffré du type « X angles par produit » ni « N créas par avatar » dans mes sources, hormis la formule 3 personas × 3 angles × 4 hooks × 3 formats = 108 ads (notion/20) et le batch ~15 ads statiques + 15 vidéos pour un nouvel avatar/ethnie (Ep #59). (8) Aucun élément de nommage de créas, aucune consigne de miniature/titre/description, aucune règle page marque vs page tierce dans mes sources — ces colonnes devront venir des domaines production/testing/dispatch (leçons 12-13, 36, 37). (9) Le persona « L'acheteur pressé » est listé (notion/20) sans angle ni créateur associé, contrairement aux trois autres. (10) Les cases Product-Aware et Most-Aware de la matrice Awareness × Hook Zone ne sont pas illustrées par des exemples de hooks dans le corpus, seulement par les libellés du tableau. (11) Les statistiques citées à l'oral (« la perte de cheveux touche 80% de la population depuis 40 ans ») sont des exemples improvisés par le formateur, explicitement approximatifs (« je ne sais pas exactement le terme, mais vous m'excuserez », 04 [02:20]) — à ne jamais reprendre comme des faits.


---

## 🪝 Hooks — les 3 premières secondes

> Le hook est traité par la formation comme le levier n°1 de la créa : « porte d'entrée du funnel », responsable de « plus de 50% de l'ad », mesuré par le HOOK RATE (3s views ÷ impressions ; <25% faible, 25-35% moyen, >35% bon, cible interne >40%). Le corpus fournit 8 typologies cumulables (les 4 principes psychologiques sont présentés par Matteo comme « quelques-uns des plus puissants », pas comme une liste close) : 4 principes psychologiques (déclencheurs visuels / pattern interrupt / effet Zeigarnik / appel à l'émotion), 8 hooks visuels, 5 winning hook practices, 4 hooks psychologiques (demo face/doll/objet quotidien/sexiness), 21 frameworks de headline avec formule à trous + 190 hooks rédigés déclinés par niveau de conscience, 4 « hook zones » (PANIC/JOY/FATIGUE/COZY) croisées avec l'awareness, 3 structures de texte à l'écran, et une série de hacks visuels (bulle, split screen, close-up main, visage). Règle centrale : un hook ne sert pas à capter n'importe qui mais à capter LE bon avatar — c'est le hook qui fait le targeting et qui signale à Meta le stage d'awareness et l'angle. Volumétrie normée : 5 variations de hook par créative faible, 3 variations + l'original = 4 ads en copy mining, 4 hooks par angle dans la matrice 108 ads, minimum 4 variations sur tout net new post-Andromeda. Pour la machine à créas, chaque ligne doit donc porter un type de hook issu de ces listes fermées, un texte à l'écran, un visuel décrit avec mouvement obligatoire dès la 0.5s, une boucle ouverte et l'endroit où elle se referme dans le body.

### Les 4 principes psychologiques d'un hook irrésistible (typologie fondatrice)
*Source : MASTER ACQUISITION / 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES [12:14-23:11] + RESSOURCES GOOGLE / 14 (document Google de la leçon 17)*

- **1. L'Utilisation de Déclencheurs Visuels** — « Les images, les couleurs vives, et les mouvements attirent l'œil et peuvent aider à transmettre votre message rapidement. » Exploite le fait que le cerveau est programmé pour faire attention à certaines couleurs (le rouge) et à tout mouvement. Pourquoi c'est efficace : 1) capte rapidement l'attention dans un environnement surchargé, 2) facilite la compréhension, 3) très simple à mettre en place. Application pratique : « Utiliser des message en rouge, bubble, ou mouvement ».
  - *Ex :* « là on a du texte ici sur un fond rouge qu'est-ce qui cause l'asiatique [Whisper : "what causes..."] » — texte blanc sur fond rouge posant une question intrigante (SOP 17 [14:25]).
- **2. Pattern Interrupt / Rupture de pattern** — « technique ULTRA puissante utilisée en marketing, en psychologie et en communication pour capter l'attention en interrompant le flux de pensée habituel ou les attentes d'une personne. » Pourquoi ça marche : 1) crée de la curiosité, 2) augmente la rétention, 3) [GAME CHANGER] facilite l'engagement émotionnel et le PIC émotionnel nécessaire aux ventes massives, 4) démarque dans un environnement saturé. Applications : « Montrer quelque chose d'habituel de manière inhabituelle » / « Montrer quelque chose de bizarre ». Utilisé en hypnose : après une rupture de pattern le prospect « va être plus facilement manipulable » et « va mieux se souvenir de ce qu'il a vu ».
  - *Ex :* « là on voit un rasoir et un œuf c'est un peu incohérent mais ce hook-là a très bien marché » ; « quelqu'un qui brûle un billet » (SOP 17 [17:22-17:44]).
- **3. L'Effet Zeigarnik (Open Loop / boucle ouverte)** — « Les gens se souviennent mieux des tâches inachevées. Commencez une histoire ou posez une question sans donner immédiatement la réponse. » Observé par Bluma Zeigarnik dans les années 1920. « Cette technique est beaucoup utilisée dans les séries télévisées ou début de podcast ». Pourquoi c'est efficace : 1) stimulation de l'engagement, 2) amélioration de la rétention (meilleur watch time), 3) création d'anticipation. Cas pratiques : « Posez une question provocatrice au début sans y répondre immédiatement » / « Commencer une histoire ou présenter un problème sans donner immédiatement la solution ».
  - *Ex :* « on a juste simplement une personne qui rentre avec du mouvement avec un "lundi" et nous on se dit ok ça va être quoi mardi mercredi jeudi vendredi » (SOP 17 [20:16]).
- **4. L'Appel à l'Émotion** — « Les émotions fortes (joie, surprise, indignation) rendent le contenu mémorable et partageable. » Émotions citées : joie, surprise, indignation, peur, tristesse. Pourquoi c'est efficace : 1) renforcement de la mémorisation, 2) augmentation du partage (« critère primordial pour devenir un WINNER »), 3) stimulation de l'engagement / motive les clics / augmente le CTR, 4) création d'une connexion personnelle avec la marque. Application pratique : « Montrez de fortes émotions dans votre hook et surtout un VISAGE ».
  - *Ex :* « j'ai eu ce bracelet donc maintenant je peux voir ma mère chaque fois que je veux — là on voit quelqu'un qui a une forte émotion » ; « le truc émotif : elle a pleuré en lisant ça » pour une boutique de bijoux (SOP 17 [35:59-37:03]).

### Les types de hook winner (par point d'entrée)
*Source : MASTER ACQUISITION / 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES [26:36-28:48]*

- **Commencer par le produit** — « vous montrez directement un wow effect, captiver l'attention avec le produit. Ça, ça marche très bien pour toutes les créatives qui vont venir s'adresser à un stage du funnel où c'est qu'ils sont déjà conscients de la solution et du produit. »
  - *Ex :* « pour tout ce qui est bijou on a aussi ce format là, on commence par le produit en close-up : "mon copain m'a surpris avec ça" » (SOP 17 [35:38]).
- **Se concentrer sur le problème** — « on va venir montrer de manière exagérée le problème de la personne, elle va se sentir directement concernée et même inconsciemment on va lui montrer ce qui peut arriver de pire, donc ça va la mettre en état d'alerte. » Attention aux règles publicitaires (montrer le problème de manière subtile).
  - *Ex :* « on s'intéressait aux personnes qui avaient une bosse de bison et on voit le problème qui est montré par une personne, on voit une croix, et ce hook-là a cartonné » (SOP 17 [28:02]).
- **Montrer le problème de manière intrigante / sur quelqu'un d'autre** — « quelqu'un qui montre quelque chose sur une autre personne est très très puissant dans le domaine des hooks... de venir montrer une partie du corps, le produit, mais de quelqu'un d'autre. » Renforcé si un signe d'autorité est visible.
  - *Ex :* « on voit qu'il y a un stylo donc naturellement on pense que c'est quelqu'un de professionnel qui met ça, qui pointe ça, donc ultra puissant » (SOP 17 [39:32]).
- **Le bizarre / le satisfaisant à l'œil** — « ensuite on a tout ce qui est bizarre, donc quelque chose de peut-être satisfaisant à l'œil ou d'intrigant. »
  - *Ex :* « on a quelque chose de courant, une orange je crois, et moisie » ; « un visage séparé en deux » ; « quelqu'un qui se lisse [les cheveux] mais avec un bandeau sur les yeux » (SOP 17 [34:54-35:16]).

### Tips & hacks visuels pour captiver l'attention en hook (et en miniature)
*Source : MASTER ACQUISITION / 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES [28:48-30:37]*

- **La bulle avec du contenu intrigant** — « mettre une petite bulle avec du contenu intrigant dedans, donc du contenu vidéo. Ça on peut le faire sur Canva assez simple : on met un cadre, on met un rond glissé, et on enregistre deux vidéos, une qui peut être très basique où on montre simplement quelque chose, et l'autre où on met un contenu en relation avec le produit. »
  - *Ex :* Réalisable sur Canva ; « ça marche très très bien pour captiver l'attention ».
- **Séparer l'écran en deux (split screen)** — « séparer la partie en deux, ça peut être comme ça ou comme ça, ça marche très très bien parce qu'on peut vite raconter une histoire très rapidement et le cerveau a le temps de regarder les deux choses. »
  - *Ex :* « c'est une technique que j'utilise pas mal et qui fonctionne très très bien » (SOP 17 [29:31]).
- **Close-up produit en main** — « tout ce qui est close up produit aux mains, ça aussi ça fonctionne très bien... de voir une main ça fonctionne très bien autant en hook qu'en thumbnail. »
  - *Ex :* « on a le produit en main, on a un effet un peu wow avec un glow, très simple, ça fonctionne très bien pour TikTok, Instagram » (SOP 17 [38:50]).
- **Visage en close-up (idéalement une jolie femme)** — « montrer un visage en close up, assez proche si possible, une femme, une jolie femme, ça va venir naturellement créer un bon hook... ça captive autant les femmes que les hommes. » Très utilisé pour le make-up et les bijoux.
  - *Ex :* « visage, joli visage qui sourit, émotion, émotion, donc voilà il y a la dose, pour TikTok c'est exactement ça qu'il faut, pour Facebook également » (SOP 17 [39:55]).

### Les 3 structures de texte gagnantes (Hook Playbook)
*Source : MASTER ACQUISITION / 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES [24:47-26:36]*

- **Structure 1 — bandeau rouge / texte blanc en haut + fond blanc, texte noir et rouge en bas** — « la première manière c'est de mettre du fond rouge et blanc, et ensuite en bas du fond blanc avec du texte noir et rouge. Ça captive très bien l'attention, ça marche très très bien... en tout cas sur Facebook, sur Instagram ça fonctionne très bien. »
  - *Ex :* Reprend les codes des panneaux de signalisation de danger : « souvent les panneaux de signalisation de danger [sont] dans ces couleurs-là et dans ces structures-là ».
- **Structure 2 — fond blanc, texte noir et rouge** — « on a simplement du fond blanc et du texte noir et rouge. Ça aussi ça marche très bien, c'est classique, ça marche très bien. »
  - *Ex :* Structure « classique » sur Meta.
- **Structure 3 — texte centré avec une partie en couleur (jaune de préférence)** — « on a le texte au centre et certaines parties du texte en une couleur, ça peut être du jaune, du rouge. Après le rouge est moins mis en avant parce que souvent ça se voit pas [selon] ce qu'il y a derrière, c'est pour ça que le jaune, de cette manière-là ça se voit et ça aussi ça marche très très bien. »
  - *Ex :* Mot-clé en jaune sur texte blanc centré.
- **Règle de position du texte** — Le texte placé en haut de l'écran surperforme le texte placé en bas.
  - *Ex :* « là le texte c'est en bas, ça marche un peu moins bien qu'en haut ; en haut il va être vu en premier, mais ça marche aussi » (SOP 17 [40:17]).

### Les 8 Hooks Visuels Irrésistibles pour stopper le scroll sur Meta Ads
*Source : RESSOURCES NOTION / 25 (document "8 Hooks Visuels Irrésistibles pour Stopper le Scroll sur Meta Ads") + CRÉATIVE INSIGHT / 45 Ep #21 (hooks 1-3) + CRÉATIVE INSIGHT / 39 Ep #24 (hooks 4-8)*

- **1. Interruption Inattendue** — Concept : « Un élément soudain perturbe le déroulement normal de la scène. Ces ruptures forcent le cerveau à prêter attention. » Exécution : commencez par une vidéo selfie classique ; introduisez un élément inattendu qui « interrompt » la scène ; gardez l'interruption brève mais marquante ; utilisez des effets sonores pour amplifier la surprise.
  - *Ex :* Exemples du doc : « Un téléphone sonne à plein volume pendant un moment calme / Une porte claque soudainement derrière le speaker / Un objet tombe dans le cadre depuis le haut / Quelqu'un traverse l'arrière-plan déguisé de façon inhabituelle. » Cas réel cité : « c'est le hook qu'a utilisé Hormozi... il faisait tomber son livre et il le rattrapait en dessous. C'est juste ça. Et il a fait 150M avec » (Ep #21 [04:06]).
- **2. Mouvement Haute Énergie (Motion)** — Psychologie : « La vision humaine est câblée pour suivre les objets en mouvement rapide — impossible à ignorer. » Exécution : positionnez-vous (ou le produit) comme l'élément stable de la scène ; créez un mouvement qui entre dans le cadre à grande vitesse ; utilisez des angles de caméra qui accentuent le dynamisme ; superposez plusieurs mouvements. Démarrer le hook AU moment où l'objet entre dans le cadre.
  - *Ex :* « Un coureur passe en sprint en arrière-plan / Un skateboard traverse rapidement l'écran / Un drone survole la scène / Plusieurs personnes marchent dans différentes directions. » Ad citée : « Quand tu compares un chantier chinois à un chantier européen, tu comprends vite pourquoi certains... » (Ep #21 [07:10]).
- **3. Chaos Contrôlé** — Concept : « Quelque chose se casse ou se transforme de manière spectaculaire — la curiosité pousse à rester pour voir les conséquences. » Exécution : choisissez des objets sans valeur ou remplaçables ; synchronisez la "destruction" avec votre message clé ; montrez le moment de transformation plutôt que le résultat final ; réagissez naturellement pour conserver l'authenticité.
  - *Ex :* « Un ballon éclate en une explosion de confettis / Une pile de papiers s'envole avec le vent / Une sculpture de glace fond rapidement / Des pièces de puzzle se dispersent sur la table. » Cas réel : la gourde Stanley intacte dans une voiture totalement brûlée — « elle a cartonné pour Stanley » ; conseil : produit neuf pour créer le contraste (Ep #21 [08:39-09:22]).
- **4. Distorsion de Réalité** — Concept : « Créez des scénarios qui font faire un "double take" au spectateur — la dissonance stimule l'engagement. » Exécution : combinez des éléments familiers de manière inattendue ; n'expliquez pas tout de suite l'absurdité ; laissez l'étrangeté parler d'elle-même ; gardez un élément normal pour ancrer la scène. Doit rester en lien avec la niche.
  - *Ex :* « Une personne en costume-cravate joue avec des petites voitures / Un ours en peluche géant assis à un bureau / Quelqu'un se brosse les dents en cuisinant / Une personne lit un livre sous l'eau dans une piscine. » Pratique interne : « à nos créateurs, on demande régulièrement de porter ou d'avoir quelque chose de singulier : des lunettes de soleil, un costume tout blanc » (Ep #24 [01:47]).
- **5. Juxtaposition Dramatique** — Psychologie : « Les contrastes forcent le cerveau à comparer — et donc à s'engager. » Concept : deux mondes opposés se rencontrent dans une seule image. Exécution : identifiez des opposés clairs (formel/décontracté, ancien/moderne) ; placez-les côte à côte ou en transitions rapides ; laissez le contraste raconter l'histoire ; utilisez la lumière et le cadrage pour accentuer les différences.
  - *Ex :* « Une voiture de luxe garée à côté d'un food truck / Une personne en smoking dans une aire de jeux / Une technologie moderne dans un décor vintage / Un minuscule objet placé à côté d'un objet gigantesque. » Exemple rédigé par Matteo : montre en papier vs vraie montre + texte « je viens d'acheter ces deux montres pour moins de 79 dollars. Voici mon honnête review » (Ep #24 [03:37]).
- **6. Suspense Mis en Scène** — Concept : « Créez une attente que "quelque chose va se produire" — cela pousse les spectateurs à rester jusqu'au bout. » Exécution : créez de la tension sans réel danger ; utilisez des angles de caméra (idéalement POV) pour suggérer un risque ; donnez l'impression que quelque chose est sur le point d'arriver ; résolvez la tension avec votre message. Cité comme « un des top, top, top » (Ep #24 [05:04]), hook rate observé jusqu'à 80 %, à ne pas sur-utiliser.
  - *Ex :* « Une pile d'objets en équilibre précaire / Un compte à rebours qui s'affiche à l'écran / Une personne marchant vers le bord du cadre / Une approche lente vers un objet mystérieux. » Exemples internes : « J'ai attrapé ma femme qui était en train de... » ; « Je dévoile pourquoi ma femme m'a largué pour cette chose qui n'est même pas humaine, dans 3, 2, 1 ». Perf citée : « si c'est bien fait, nous ça nous a fait des hook rate à 80% » (Ep #24 [04:43-06:44]).
- **7. Révélation Surprise** — Psychologie : « L'anticipation et la découverte activent les circuits de récompense du cerveau. » Concept : un élément caché devient soudainement visible. Exécution : commencez par une vue partielle ou une fausse piste ; construisez l'anticipation autour de la révélation ; rendez la révélation à la hauteur de l'attente ; reliez la surprise à votre message.
  - *Ex :* « La caméra recule pour révéler un contexte inattendu / Une personne s'écarte pour dévoiler une scène cachée / Un objet se retourne pour montrer son autre face / Un zoom arrière révèle un décor bien plus vaste. » Cas interne : « On avait fait ça avec un hook pour le Skool, avec Luca : on l'avait mis dans un [conteneur] poubelle, il commence à parler, boom, j'arrive, et on m'écoute. Et ce hook-là avait vraiment très très bien marché » (Ep #24 [09:21]).
- **8. Quotidien Amplifié** — Concept : « Transformez des frustrations quotidiennes en situations visuellement extrêmes. Le côté "relatable" dramatique crée une connexion immédiate. » Exécution : identifiez des expériences universelles ; exagérez l'échelle ou la quantité ; gardez un pied dans la réalité ; utilisez l'humour pour maintenir l'engagement. Souvent des hooks de pain point.
  - *Ex :* « Une minuscule tasse débordant d'une quantité énorme de café / Une boîte mail affichant des milliers de messages non lus / Une personne ensevelie sous une montagne de reçus / Un téléphone rempli de 47 applications pour la même fonction. » Application : perte de cheveux — « à la place de montrer quelques cheveux dans la main, vous allez montrer une masse de cheveux » (Ep #24 [10:05]).
- **Pro Tips du document** — « Combinez plusieurs hooks pour un impact plus fort / Testez différentes variations pour voir ce qui résonne avec votre audience / Reliez toujours le hook visuel à votre message principal / Assurez-vous que tous les scénarios puissent être recréés en toute sécurité / Utilisez ces idées comme base pour des versions générées par IA. »
  - *Ex :* Rappel final du doc : « L'objectif n'est pas seulement d'arrêter le scroll — c'est de créer une intrigue qui mène vers votre message. »

### Les 5 Winning Hook Practices
*Source : CRÉATIVE INSIGHT / 44 Ep #20 - 5 Winning Hook Practices*

- **1. Motion** — « C'est un mouvement qui attire le regard. » 3 déclinaisons données : accéléré, reverse (inversé), ralenti. « Ces trois types de hook marchent parce que le mouvement ça attire le regard. » Se combine avec le fait de « parler du produit sans vraiment révéler pourquoi il va impressionner ».
  - *Ex :* « un effet où il y a du mouvement, où on tombe de manière légèrement accélérée... on aurait pu faire pareil en reverse, elle part d'en bas et elle décolle » + texte « This pillow will instantly knock you out » — « En quoi ? Ce produit va faire quoi ? Et c'est pour ça que ça nous hook » ([00:44-01:47]).
- **2. Facial Expression** — « On est fait pour être arrêté instantanément quand il y a une forte expression parce qu'on est des êtres humains sociaux, et quand il y a une forte expression ça veut dire que l'autre en face ressent quelque chose et on veut savoir ce qu'il ressent. » Application : demander aux créateurs des émotions de dégoût, d'étonnement, de pleurs.
  - *Ex :* « Ça marche très très bien pour les produits à offrir : vous pouvez montrer juste la réaction de la personne qui pleure en ouvrant le produit. Ça cartonne vraiment » ([03:38]).
- **3. Product Showcase** — « vous allez venir présenter directement le produit durant les premières secondes. Pourquoi ça marche... vous n'allez pas avoir les plus gros hook rate mais vous allez avoir les meilleures conversions. Parce que les gens qui regardent ça, c'est qu'ils sont intéressés par le produit. » Touche des audiences plus aware ; fort hold rate.
  - *Ex :* « c'est pas sur ces types de hook là que vous allez avoir du 70%... mais vous pouvez avoir des winning ads à 30% si vous montrez le produit » ; conseil de Matteo : « je l'aurais fait aussi en reverse : le produit tombe et remonte dans sa main » ([04:00-05:29]).
- **4. Relatabilité** — « mieux vous présentez la situation que vit votre client cible, plus il s'y reconnaîtra. Donc plus vous serez précis sur ce qu'il expérimente vraiment dans la vie réelle, plus ça va lui parler. » Utiliser 2-3 plans rapides de situations réelles déclencheuses d'émotion.
  - *Ex :* « quelqu'un qui perd des cheveux : vous allez montrer dans un lavabo les cheveux dans sa main, parce que c'est ce qui arrive » ; chien qui détruit la maison = « il brûle mon argent... je me sens pire dans ma maison » ([06:15-07:21]).
- **5. Open Loop** — « l'objectif principal c'est de donner envie au spectateur d'en savoir plus, et on ne dévoile pas rapidement. » Moins visuel, davantage porté par le texte ; touche des audiences très unaware ; permet de targetter très large si l'introduction produit est bien faite.
  - *Ex :* Ad citée ayant généré « plus de 500K de revenus » : personnage atypique (veste en cuir, lunettes) + texte « on a juste interviewé une polyglotte » — « what the fuck, qu'est-ce qu'elle va nous dire ? ». Transposition perte de cheveux : « on a juste interviewé un homme de [70] ans qui a plus de cheveux qu'un homme de 20 » ([08:06-09:38]).

### Les 4 types de hooks psychologiques (avec bonus mini-mic)
*Source : CRÉATIVE INSIGHT / 24 Ep #42 - 4 types de hooks psychologiques + RESSOURCES NOTION / 49 (4 Hooks Analyse)*

- **1. Demo on face (tracés / marquage sur la partie du corps traitée)** — « le principe de ce hook-là c'est de venir montrer la partie du corps, l'avatar, où c'est qu'on veut traiter... et de venir dessiner des traits comme en fait avant opération. Ça permet de captiver l'attention parce qu'on se dit ok, des rides, ok ça peut me concerner, des traits, qu'est-ce qui se passe, la chirurgie ? Puis inconsciemment la personne se pose beaucoup de questions. » Marche « extrêmement bien » en santé et cosmétique.
  - *Ex :* « faire par exemple des traits sur le pied... ou pour les genoux, faire des traits comme ça et une main de médecin avec un gant en latex qui touche le pied, c'est banger banger » ([00:44-01:47]).
- **2. Demo on doll (démonstration sur une poupée)** — « le fait d'utiliser une poupée ça va venir agir comme un pattern interrupt. » Sert à démontrer et à cibler : « là on est plus sur un hook de solution aware »; à utiliser quand l'ad discrédite les autres solutions.
  - *Ex :* Poupée + texte « stop using concealer » ; « là on voit une main. D'ailleurs les mains ça captive toujours l'attention, peu importe ce que vous montrez, si vous mettez une main dessus ça va venir captiver encore plus l'attention que sans main » ([02:20-03:03]).
- **3. Demo sur objet du quotidien** — « démonstration visuelle avec des objets quotidiens ou des poupées, ça marche extrêmement bien en créa. Le fait de démontrer votre produit sur des fruits, sur des légumes, sur des objets du quotidien. » Process IA donné : demander à Claude d'analyser l'ad et de proposer sur quel objet du quotidien démontrer l'efficacité ou discréditer les autres solutions.
  - *Ex :* « Je pense notamment à Boku [toilettes japonaises] qui démontrait... sur un tissu blanc... et c'était compliqué à essuyer avec du papier versus avec de l'eau. » Ad « donut » : gros plan sur un donut rose tenu à la main + texte « Shh... THIS is my secret for the smoothest butthole » ([03:26-05:17] + Notion 49).
- **4. Sexiness / tension d'attraction** — « le principe de ces types de hooks c'est de mettre directement un contexte de l'attraction entre l'homme et la femme. Le but c'est de venir stimuler un désir inconscient de se reproduire... c'est dans les désirs les plus forts. » Contraintes : « il faut que ce soit scannable, il faut qu'on comprenne, il faut qu'il y ait une tension ». Mettre une femme : « le fait de mettre une femme en hook, surtout une jolie qui a une tension, ça marche autant bien chez les hommes que chez les femmes ».
  - *Ex :* « là, pour les couples mariés, ceci marche un peu trop bien » ; structure observée : hook en 2 blocs de 2 secondes (5 secondes au total) avec une main de femme — « je garantis que si on mettait une main d'homme ça marcherait moins bien, on l'a déjà testé » ([05:17-08:13]).
- **BONUS — Mini mic (micro-cravate visible)** — « le micro, parce qu'on l'a testé, ça augmente le hook rate... ça va venir rajouter un % supérieur de hook rate. C'est-à-dire que vous captivez plus facilement l'attention si la personne porte un micro. » Hypothèse donnée : « la personne dit quelque chose d'important si elle a le micro ».
  - *Ex :* Ad « Bone Broth » (créateur IFANCC) : femme face caméra tenant un micro-cravate et une canette BROYA 100% Grass Fed Bone Broth (Notion 49).

### Les 21 frameworks psychologiques de headline/hook (avec formule à trous) — librairie de 190 hooks
*Source : RESSOURCES NOTION / 33 "190 Psychological Hooks based on the 21 Proven Frameworks for Winning Headlines" + CRÉATIVE INSIGHT / 61 Ep #7. Chaque framework est décliné sur les 5 niveaux de conscience : Most Aware, Product Aware, Solution Aware, Problem Aware, Unaware.*

- **1. Fast and Specific Results** — Formule : « Achieve [Desire] in just [Timeframe] with [Opportunity] – made possible only by [Mechanism]. »
  - *Ex :* Most Aware : « Flawless skin in 7 days – trusted by thousands for proven results. » / Problem Aware : « Regain energy in just 1 week – powered by natural, caffeine-free ingredients. »
- **2. Unique Solution to a Frustrating Problem** — Formule : « Say goodbye to [Pain Point] with the only [Opportunity] that turns [Desire] into reality: [Mechanism]. »
  - *Ex :* « Foot pain relief, instantly – precision comfort with every step. » / « No more energy crashes – powered naturally, without caffeine. »
- **3. Unexpected Novelty** — Formule : « [Opportunity] is a brand-new way to [Desire], and it works thanks to [Mechanism]. »
  - *Ex :* « Sleep cool, wake refreshed – the revolutionary mattress topper. » / « Instant skin revival – a unique blend of ice therapy and hydration. »
- **4. A Bold Promise** — Formule : « You've never seen [Desire] like this before – discover [Opportunity] and how [Mechanism] changes everything. »
  - *Ex :* « Lose weight, stress-free – hunger-blocking innovation that works. » / « Beat stress in 30 seconds – fast, proven relief that lasts. »
- **5. Urgency + Reward** — Formule : « You need to try [Opportunity] before it's too late to [Desire]. Only [Mechanism] makes it possible. »
  - *Ex :* « Comfort that won't last – order now before stock runs out. » / « Save 30% today – the ultimate energy boost at a limited-time price. »
- **6. Transformational Desire** — Formule : « Go from [State A] to [State B] with [Opportunity], the only way made possible by [Mechanism]. »
  - *Ex :* « Irritation to comfort – anti-friction wear that works all day. » / « Bloat to slim – waist-sculpting made effortless. » / « How I went From This To This »
- **7. Challenge the Doubt** — Formule : « Think [Desire] is impossible? Try [Opportunity], and see how [Mechanism] proves it isn't. »
  - *Ex :* « Losing weight doesn't have to be hard – discover effortless results. » / « Can productivity really be effortless? AI tools prove it can. »
- **8. Blame and Liberation** — Formule : « It's not your fault that [Pain Point]. [Opportunity] uses [Mechanism] to help you finally achieve [Desire]. »
  - *Ex :* « Diets don't work – lose weight with innovative hunger management. » / « Sleepless nights aren't your fault – adaptive pillows change everything. »
- **9. Exciting Change** — Formule : « Ready for a better way to [Desire]? [Opportunity] is the only method that uses [Mechanism] to get you there. »
  - *Ex :* « Frustrated with failed diets? Waist-sculpting innovation delivers results. » / « Tired of running out of battery? Experience true wireless charging freedom. »
- **10. Irresistible Offer** — Formule : « Imagine achieving [Desire] without [Pain Point]. With [Opportunity], powered by [Mechanism], it's finally possible. »
  - *Ex :* « Lose weight without starving – smarter hunger-blocking strategies. » / « Boost energy without jitters – natural remedies that really work. »
- **11. Measure the Size of the Claim** — Formule : « [Action] [Product] to achieve [Specific Outcome]. »
  - *Ex :* « Burn 500 calories a day – effortless results proven by thousands. » / « Reduce stress by 70% – guided relaxation techniques that work. »
- **12. Measure the Speed of the Claim** — Formule : « [How-To] [Action] with [Product] in [Timeframe]. »
  - *Ex :* « How to eliminate skin redness in just 48 hours – hydration that works. » / « How to calm your mind in under 10 minutes – proven stress relief methods. »
- **13. Use an Authority** — Formule : « I [Authority Action] with [Product] and discovered [Big Insight]. »
  - *Ex :* « I researched 50 posture solutions – only one delivered true relief. » / « I thought fast charging was a gimmick – until I tried this. »
- **14. Before and After** — Formule : « Before [Problem], I used [Product], and now [Outcome]. »
  - *Ex :* « Before adaptive pillows, my nights were sleepless – now, I wake up refreshed. » / « Before energy-saving systems, my bills were sky-high – now, I save hundreds every month. »
- **15. Compare the Claim to Its Rival** — Formule : « [Product] works [Speed/Effectiveness] compared to [Competitor/Rival Method]. »
  - *Ex :* « Anti-friction boxers stay fresher 3x longer than ordinary boxers. » / « Stress-relief apps reduce anxiety 2x faster than meditation. »
- **16. Remove Limitations from the Claim** — Formule : « How to [Action] with [Product] even if [Limitation]. »
  - *Ex :* « How to lose weight – even if you hate dieting. » / « How to fix your posture – even if nothing else has worked. »
- **17. State the Claim as a Question** — Formule : « Who else wants to [Desire] with [Product] without [Pain]? »
  - *Ex :* « Who else wants to lose weight without starving themselves? » / « Who else wants perfect posture without wearing a brace? »
- **18. Offer Information in the Claim** — Formule : « [How-To] [Action] with [Product] in [Timeframe]. »
  - *Ex :* « How to fix back pain in just two weeks. » / « How to brew barista-quality coffee in 3 minutes. »
- **19. Stress the Newness of the Claim** — Formule : « NEW: [Product] helps [Action] like never before. »
  - *Ex :* « NEW: Hunger-blocking shakes help you lose weight like never before. » / « NEW: Stress-relief apps calm your mind faster than ever. »
- **20. Stress the Exclusiveness of the Claim** — Formule : « The only [Product] that [Action]. »
  - *Ex :* « The only pillow that adapts to your sleep automatically. » / « The only posture device backed by leading chiropractors. »
- **21. Challenge Your Prospect's Beliefs** — Formule : « I thought [Belief], but then [Product] proved [Result]. »
  - *Ex :* « I thought posture braces were gimmicks, but this one worked. » / « I thought stress relief took hours, but this solution proved it doesn't. »

### Les 3 rôles d'un hook gagnant + les 3 mécaniques biologiques + les règles d'or
*Source : 0 to 1 : MASTER ONE / 39 Le Parcours Psychologique des créatives Hook 1/2*

- **Rôle 1 — Attraper l'attention** — « captiver l'attention de votre prospect... pas captiver l'attention de n'importe qui, sinon n'importe qui peut faire des hooks clickbait qui vont attirer l'attention de n'importe qui, mais captiver l'attention de VOTRE prospect » ([01:29]).
  - *Ex :* « le prospect ne réfléchit pas, il scrolle, il veut juste la dopamine, il veut des choses simples à scanner, il veut des femmes, des émotions, des trucs drôles » ([02:11]).
- **Rôle 2 — Faire dire "c'est pour moi" (contexte immédiat / pertinence)** — « dans les 1 à 5 premières secondes, il doit comprendre que ça parle pour lui... le rôle de votre hook c'est d'être pertinent, c'est de targetter la bonne personne. Meta, TikTok, ce qu'ils veulent c'est que vos hooks fassent aussi le filtre » ([06:36-06:57]).
  - *Ex :* « un hook peut être beau, surprenant, viral, mais sans signal de pertinence par rapport au prospect il ne va pas retenir la bonne audience et du coup il ne va pas marcher » ([07:20]).
- **Rôle 3 — Créer une attente (boucle ouverte)** — « ça doit créer une boucle ouverte, une question dans la tête du prospect pour qu'il reste... un bon hook ne montre pas tout, il doit ouvrir une boucle dans la tête » ([01:50-02:34]).
  - *Ex :* « je vous montre un hook où il y a plein de personnes dans une rue... le but c'est pas de montrer directement ce que c'est... et après il peut y avoir un message : "les habitants de Chicago ont été sous le choc en découvrant ceci dimanche matin" » ([02:34-03:23]).
- **Mécanique 1 — Mouvement** — « Il faut toujours qu'il y ait du mouvement dans un hook, très très important... le cerveau il est programmé pour détecter le mouvement : un geste de la main, une tête qui tourne, quelque chose qui tombe, un zoom, des micro-mouvements. Peu importe, il faut qu'il y ait du mouvement dans le hook. » Contrainte de timing : « il doit y avoir le mouvement direct dans la première seconde. Dans la 0.5 seconde il doit y avoir du mouvement » ([03:47-04:36]).
  - *Ex :* « tous vos hooks doivent comporter du mouvement ».
- **Mécanique 2 — Facile à scanner** — « Un hook doit être facile à scanner. Si c'est un truc compliqué ou si le cerveau ne comprend pas, il va dire non, c'est trop compliqué pour moi... le hook doit être compris en un seul regard. Le cerveau ne doit jamais chercher. » Impératifs : plan serré / zoom sur ce qu'on doit regarder, émotion lisible (doute, surprise, dégoût), bien éclairé, texte lu rapidement, UN SEUL point focal ([04:36-06:10]).
  - *Ex :* « un autre hack c'est de montrer des mains qui tiennent quelque chose. Ça marche toujours. C'est un hack psychologique » ([05:00]).
- **Mécanique 3 — Rôle stratégique : le hook fait le targeting** — « le hook sert aussi à indiquer à l'algorithme quel stage d'awareness tu parles et quel angle tu attaques... si vous mettez dans votre hook un hook qui parle du problème, ça va targetter les gens qui sont aware à ce problème-là » ([10:21-10:44]).
  - *Ex :* « si vous voulez cibler des gens qui veulent juste la meilleure offre, si vous faites un hook sur le prix — "c'est le meilleur prix qu'on n'a jamais vu" — vous allez targetter ces types de personnes » ([11:06]).
- **Les règles d'or d'un hook gagnant (checklist)** — Liste énoncée à [11:27-13:18] : « il y a le mouvement, visuel immédiat, émotion ou tension visible » ; « cible claire, on cible l'avatar » ; « curiosité ouverte, sans tout révéler » ; « une headline qui cible » ; « on ne donne pas la solution complète dès le début » ; « on ouvre une question ou une loop et on la ferme dans la vidéo » ; « tu dois parler comme ton avatar parle dans sa tête » ; « un seul point focal visuel ».
  - *Ex :* « si vous dites "les trois méthodes qui permettent d'enlever l'acné naturellement", montrez ces trois méthodes. Ne mettez pas un body de vidéo qui ne répond pas à ce hook, très très important » ([12:34]).
- **3 types de hook nommés dans la leçon** — « hook identité » (cibler précisément l'avatar avec son problème) ; « hook curiosité ouverte » ; « hook aversion à la perte ».
  - *Ex :* Hook curiosité ouverte : « un barber qui laisse tomber le produit au ralenti + "J'ai testé un truc que personne n'utilise pour la repousse de barbe" ». Hook aversion à la perte : « plein de dentifrices qui tombent dans une baignoire + "arrête de gaspiller ton argent dans ça". Le cerveau veut savoir pourquoi » ([09:15-09:36]).

### Les 5 personas psychologiques et les 4 Hook Zones (matrice Mood × Intensité, et matrice Awareness × Hook Zone)
*Source : RESSOURCES NOTION / 41 "Quick Win — Changer l'approche psychologique de ton ads" + CRÉATIVE INSIGHT / 05 Ep #57*

- **A — Le Résigné (zone FATIGUE : mood négatif, intensité basse)** — « Conscient du problème depuis des années. Il a essayé 3 trucs. Rien n'a marché. Il est FATIGUÉ. → Il veut de la validation, pas de l'espoir. "C'est pas ta faute." » Ton : posé, empathique, aucune promesse magique.
  - *Ex :* Hook (niche perte de cheveux homme) : « Si t'as essayé Minoxidil, biotine, greffes et rien n'a marché. C'est peut-être pas ta faute. »
- **B — L'Aspirationnel (zone JOIE : mood positif, intensité haute)** — « Jeune, pas vraiment le problème. Il achète la transformation, pas la solution. → Il veut du RÊVE, du before/after, du glow-up. » Ton : transformation, before/after, énergie haute.
  - *Ex :* Hook : « Ce mec a rasé son crâne à 22 ans. Regarde-le 8 mois plus tard. »
- **C — L'Anxieux latent (zone PANIQUE : mood négatif, intensité haute)** — « Il sent que quelque chose cloche. Il n'a pas mis de mot. Il flippe. → Il veut qu'on NOMME son problème pour lui. » Ton : urgent, explicatif, nomme le mécanisme caché.
  - *Ex :* Hook : « Tu remarques plus de cheveux dans ton lavabo depuis 3 mois ? Voici ce qui se passe vraiment. »
- **D — Le Confortable (zone COZY : mood positif, intensité basse)** — « Sa vie va bien. Il achète les trucs qui l'améliorent sans drama. → Il veut du "casual upgrade", zéro pression. » Ton : chill, social proof, aucune pression.
  - *Ex :* Hook : « Le shampoing que 40% des New-Yorkais 30+ utilisent chaque matin. »
- **E — L'Anti-pub (zone COZY, versant organique)** — « Il a vu 1000 ads cette semaine. Il scroll en 0.3s tout ce qui crie. → Il veut du CONTENU brut, pas de la pub. UGC POV, format organique. » Ton : zéro pub, contenu brut, UGC hardcore.
  - *Ex :* Format : « POV d'un mec qui filme lui-même son shampoing dans sa douche : "Les gars regardez ce que ma copine m'a offert." »
- **Matrice Awareness × Hook Zone (quelle zone utiliser à quel stage)** — Grille du document : Unaware → COZY = trop tôt, JOY = pas de raison, FATIGUE = crée le problème, PANIC = shock awake. Problem-Aware → COZY = mismatch de ton, JOY = prématuré, FATIGUE = commisération, PANIC = escalation. Solution-Aware → COZY = intro douce, JOY = la solution existe, FATIGUE = redondant, PANIC = manipulateur. Product-Aware → COZY = founder story, JOY = transformation, FATIGUE = crash de mood, PANIC = tue la confiance. Most-Aware → COZY = rassure, JOY = push final, FATIGUE = buzzkill, PANIC = mauvais moment.
  - *Ex :* Volumétrie associée : « Récupère 5 hooks + 5 angles distincts... tu fais un pack de 15 static selon les 5 persona : 1 headline par approche psycho × 3 visuels = 3×5 = 15 ads. Résultat attendu : ton hit rate passe de 8-10% à 15-20%. »

### Framework de headline/hook "Pattern Break + Projection + Insight" (effet Von Restorff + future pacing)
*Source : RESSOURCES NOTION / 43 [PROMPT] Créez des Headlines qui convertissent + CRÉATIVE INSIGHT / 64 Ep #3*

- **Étape 1 — Commence par une distinction qui casse les codes (effet Von Restorff)** — « Utilise des formulations étranges, audacieuses ou spécifiquement inattendues pour interrompre le scroll. C'est ici qu'on exploite l'effet Von Restorff : si ça ne ressemble à rien d'autre dans le feed, tu gagnes. »
  - *Ex :* « Il y a un homme en Finlande qui n'a pas payé pour des soins de peau depuis 10 ans — et sa peau ressemble à du marbre. » / « Imagine une chaussette si douce qu'elle te fait remettre en question toute ton enfance. »
- **Étape 2 — Projette-les dans un futur qu'ils désirent (future pacing)** — « montre-leur à quoi ressemblera leur vie une fois que ton produit aura résolu leur problème. Le futur doit être vivant, émotionnellement chargé, et transformateur en termes d'identité. »
  - *Ex :* « Dans trois semaines, tu ne te souviendras même plus de ce qu'était la douleur aux pieds. » / « Tu vas essayer ce t-shirt une fois — et tous les autres te sembleront faits de papier de verre. »
- **Étape 3 — Donne-leur une vérité tranchante, impossible à nier (insight)** — « Frappe fort émotionnellement. Apporte un insight précis, un peu dérangeant, qui explique pourquoi leur situation actuelle est insatisfaisante, et pourquoi ta solution est la clé. »
  - *Ex :* « Tu n'es pas ignoré. Tu es juste invisible. » / « Tes concurrents ne sont pas meilleurs — ils sont juste plus audacieux. » / « Le confort n'est pas une option. C'est la raison pour laquelle on revient. »
- **Règle de conversion "promesse floue → promesse qui vend"** — Tableau du document : remplacer une promesse vague par une promesse claire, concrète, émotionnelle et datée.
  - *Ex :* « Le soin naturel aux extraits de plantes » → « Une peau éclatante en 7 jours – sans produits chimiques, pour enfin te sentir rayonnante naturellement. » ; « Une nouvelle manière de bouger » → « 15 minutes par jour pour soulager ton dos – dès 1 semaine, et retrouver le plaisir de bouger librement. »
- **Sorties réelles générées (exemples validés à l'oral par Matteo)** — Exemples produits par le prompt et commentés comme « très très puissant » et utilisables tels quels en hook ou en static.
  - *Ex :* Épilateur : « Ce n'est pas un rasoir, ce n'est pas une cire, c'est la fin des poils. » / « Tu ne te rases pas moins, tu ne te rases plus. » / T-shirt homme : « Ce n'est pas un t-shirt, c'est une déclaration de style. » / « Trop chaud, trop serré ? Ce t-shirt dit non au confort [inconfort]. Dès le premier port tu oublieras les anciens. » (Ep #3 [04:49-08:09])

### Hooks qui cassent le cerveau — croyances limitantes / dissonance cognitive (3 questions + prompt)
*Source : RESSOURCES NOTION / 31 "Créer new Hooks qui cassent le cerveau" + CRÉATIVE INSIGHT / 57 Ep #10*

- **Question 1 — Qu'est-ce qu'il croit sur LUI-MÊME qui l'empêche d'acheter ?** — Prompt EN : « What's something [TARGET AUDIENCE] believes about themselves that might stop them from buying [YOUR PRODUCT] — even though it could actually help them? »
  - *Ex :* « Ce genre de T-shirt, c'est pas pour les mecs comme moi… » / sortie GPT : « à mon âge, je ne suis pas censé faire attention à mon style, ce t-shirt c'est pour les jeunes ».
- **Question 2 — Quelle histoire il se raconte pour ne pas passer à l'action ?** — Prompt EN : « When [TARGET AUDIENCE] sees an ad for [YOUR PRODUCT], what story do they tell themselves to justify not [DESIRED ACTION]? »
  - *Ex :* « Encore un truc de hipster hors de prix… » / « Encore une marque qui mise sur le look et pas sur le confort, je vais transpirer là-dedans, ça va me tailler. »
- **Question 3 — Quelle croyance il doit lâcher pour oser essayer ?** — Prompt EN : « What belief would [TARGET AUDIENCE] need to challenge or let go of in order to feel confident and excited about [DESIRED ACTION]? »
  - *Ex :* « Peut-être que je peux être stylé ET à l'aise. »
- **Mécanisme : la dissonance cognitive** — « Tu crées du cognitive dissonance → leur cerveau veut résoudre le conflit. Tu les fais se remettre en question. Et tu les amènes à dire : "Et si ça marchait vraiment… pour moi ?" » Peut s'appliquer au hook OU au lead (les 5-10 premières secondes).
  - *Ex :* Hooks générés : « À 50 ans, je ne vois pas l'intérêt de m'habiller comme un ado. » / « Je pensais que le confort et le style étaient contraires. J'avais tort. » (Ep #10 [05:26])

### Curiosity + Reverse Psychology (framework de concept + hook)
*Source : RESSOURCES NOTION / 22 "Curiosity + Reverse Psychology" + CRÉATIVE INSIGHT / 36 Ep #30*

- **Étape 1 — Contredire ce que l'audience croit** — « Start with a statement or visual that contradicts what the audience believes. Think: bold, confusing, or intentionally "wrong-sounding" statements that prompt, "That can't be right…" »
  - *Ex :* Objectif : une curiosité de type « Attends… quoi ? »
- **Étape 2 — Psychologie inversée** — « Use Reverse Psychology to push against what they think they want. Frame your message as, "Go ahead, keep doing what you're doing…" — then reveal why that path is broken. »
  - *Ex :* Hook cité dans l'épisode : « Stop looking for a better fit » puis « Go ahead, train another one, another one, does it work? Le problème, ce n'est pas le fit. »
- **Étape 3 — Laisser un gap de logique puis délivrer l'insight** — « Leave a moment of confusion or a gap in logic. Your goal is to have the viewer internally protest the idea... Finally, land on an insight that reorients their thinking. »
  - *Ex :* Format de sortie imposé par le prompt : Big Idea / Premise, Narrative Angle or Hook, Psychological Mechanism in Use, Suggested Formats — « Generate 3 ad concepts using this framework. »

### Le hook dans les frameworks de script (place et forme du bloc HOOK)
*Source : MASTER ACQUISITION / 11 Scripter ses ads partie 3 + RESSOURCES NOTION / 14 (Discredit) + RESSOURCES NOTION / 18 (Villain) + RESSOURCES NOTION / 21 (Narrative Ads) + RESSOURCES NOTION / 29 (SOP avis client)*

- **Framework Direct Response court (ads >500K)** — Structure : « hook, ça discrédite, solution main-benefit, user-benefit, social proof et call to action » (Scripter ses ads P3 [00:29]). Le hook y joue sur le regard des autres — très unaware, donc très scalable.
  - *Ex :* Hook alternatif donné si le produit est à fort problème : « les médecins sont époustouflés par ce masseur révolutionnaire » ([03:23]).
- **Framework produit direct (solution/product aware)** — « au niveau du hook on va venir montrer le produit directement... le but c'est de montrer le produit directement, de montrer un wow effect » puis unique USP → mécanisation du bénéfice → CTA intégré ([03:49-06:18]).
  - *Ex :* T-shirt : « on va venir tirer le t-shirt, on va venir montrer que c'est élastique ».
- **Framework Discredit — HOOK (Pattern Interrupt)** — Bloc 1 du script : « HOOK (Pattern Interrupt) → Stopper le scroll immédiatement avec une phrase choc et inattendue + target product aware. »
  - *Ex :* Script EN mot pour mot : « Don't buy the Space Buddy. » Variante marque : « Plushy est un scam, je vais vous expliquer pourquoi » — « comme ça vous allez venir targetter tous ceux qui s'intéressent à Plushy » (Ep #36 [03:18]).
- **Framework Villain — HOOK → VILLAIN INTRO → UMP → UMS-HERO → Proof → Authority → CTA** — « un framework qui marche, c'est bien sûr un hook qui va introduire rapidement le vilain » (Ep #33 [06:06]). Formule associée : « Ce n'est pas ta faute si X… C'est parce que Y t'a appris à faire Z ». Le villain peut être : une habitude, une croyance, une ancienne solution, une industrie, une norme acceptée.
  - *Ex :* « manger du sucre m'a aidé à perdre 50 kilos cette année » — « un truc what the fuck, ok ? On va captiver les gens qui sont aware au sucre » (Ep #33 [06:28]).
- **Framework Narrative Ads** — « Commence calmement : un hook simple face caméra surperforme souvent les ouvertures agressives. » Un seul angle / une seule Big Idea. Durée : 20 à 60 secondes maximum. Technique : « faire un hook du style [dire] la phrase clé, une phrase qui est dans le script qui est intrigante ».
  - *Ex :* Complément testostérone : « comment je suis passé de coucher trois fois par mois avec ma femme à cinq fois par semaine » (Ep #29 [01:08-01:32]).
- **Framework AIDA à partir des avis clients — 4 hooks par script** — « ⚠️ HOOKS REQUIREMENT (4 per script) : 2 hooks inspired from your "winning hook" framework or hook library — use psychological triggers like status, fear of missing out, emotional transformation, curiosity, self-image, etc. ; 2 hooks taken verbatim from real customer reviews — short, punchy, emotionally compelling quotes that naturally lead into the ad. » + « Use exact customer language — no rephrasing. »
  - *Ex :* Hooks verbatim sortis : « J'ai littéralement donné tous mes autres pantalons. » / « Je n'ai [pas] pu porter autre chose. » / « Ils sont si doux, je ne les sens même pas. » / « Mon mari les adore, il dit qu'il n'a jamais eu de pantalons si confortables. » (Ep #8 [05:44])

### Nouveau format de hook testé en avant-première : le panneau "ATTENTION"
*Source : CRÉATIVE INSIGHT / 19 Ep #45 - Nouveau Hook (template Canva fourni)*

- **Hook panneau d'avertissement (inspiration parc d'attraction Dubaï)** — « le but c'est d'avoir un panneau comme ça et de mettre votre hook de ce format-là. Ça peut être "Attention, quelque chose comme ceci"... peut-être en haut, en rouge, ça marche aussi bien. Et votre hook ici. » Règle de mise en page : « le but c'est de mettre le texte à peu près à cette hauteur-là, donc respectez-le, il y a assez de zone. » Le produit peut être intégré au panneau.
  - *Ex :* « si vous vendez un rouge à lèvres vous pouvez mettre un rouge à lèvres comme ceci : "Attention, les rouges à lèvres qui contiennent ceci sont dangereux pour la santé." Bon, voilà votre hook. » ([01:05-01:27])

### Ce qui fait un MAUVAIS hook (anti-patterns explicites)
*Source : CRÉATIVE INSIGHT / 45 Ep #21 + CRÉATIVE INSIGHT / 24 Ep #42 + 0 to 1 / 39 + MASTER ACQUISITION / 17*

- **Le hook "what the fuck" sans lien avec le produit** — « ça ne sert à rien de faire des hooks what the fuck qui n'ont pas de liaison avec votre produit. Ça on a déjà testé et ça peut marcher sur TikTok, mais sur Meta et même maintenant ça ne fonctionne plus parce que vous avez un faible taux de conversion. Vous allez venir capter des gens qui ne sont pas vos acheteurs » (Ep #21 [02:52]).
  - *Ex :* « ne faites pas des choses qui sont décorrélées de votre produit. Il faut vraiment qu'il y ait un lien avec votre produit » (Ep #42 [05:39]).
- **Le hook clickbait qui capte n'importe qui** — « tous les gourous qui font des hooks [disent] qu'il faut juste captiver l'attention : c'est FAUX. Ce qu'il faut c'est captiver la BONNE audience et ensuite avoir un fort taux de conversion » (Ep #20 [07:21]).
  - *Ex :* « vous pouvez mettre un hook totalement différent mais vous allez venir captiver l'attention des mauvaises personnes, du coup ça n'a pas de sens » (SOP 17 [38:29]).
- **Le hook incohérent avec l'avatar / le body** — « si vous avez un bon hook et que vous dites quelque chose de pas cohérent par rapport à votre cible, ça peut faire chuter vos résultats » (SOP 17 [10:24]). Et : « dès qu'il y a de l'incohérence, le cerveau il lâche » (0 to 1 / 39 [13:18]).
  - *Ex :* « il n'est pas venu me montrer ici une fille en bikini puis ensuite parler de genoux parce que là les gens auraient lâché » (Ep #9 [03:00]).
- **Le hook compliqué / multi-focal / statique** — « si c'est un truc compliqué ou si le cerveau ne comprend pas, il va dire non c'est trop compliqué pour moi, je ne veux pas regarder... On ne doit pas savoir si c'est ça, si c'est ça, si c'est ça qu'on doit regarder » (0 to 1 / 39 [04:36-05:44]).
  - *Ex :* « si vous avez un hook chaotique comme ça et que le hook commence comme ça, qu'est-ce que vous devez regarder ? »
- **Le hook qui révèle tout / qui ne referme pas sa boucle** — « un bon hook ne montre pas tout » ; « si vous montrez direct, ça va venir casser la tension » ; « vous devez répondre à votre hook dans la vidéo, sinon vous n'allez pas fermer quelque chose, il va rester une frustration » (0 to 1 / 39 [02:34], [03:23], [12:34]).
  - *Ex :* « ne mettez pas un body de vidéo qui ne répond pas à ce hook ».
- **Trop de texte à l'écran (risque algorithme + test contre-intuitif)** — « plus on met de texte, plus l'algorithme va être capable de bloquer la créative » (SOP 17 [38:07]). Test interne rapporté : « on a vu que tous les ads sans texte marchaient mieux... après c'est propre à chaque marque, à chaque marché » (Mastermind Q4 [1:15:14-1:15:56]).
  - *Ex :* « il faut vraiment que vous le testiez, parce que c'est propre à tous les produits. »
- **L'usure des hooks à la mode** — « le marché change, les gens deviennent plus ou moins sophistiqués... certains hooks, une fois qu'ils seront vus et revus, vont moins bien marcher. Il sera toujours important de se renouveler... de toujours regarder les principes psychologiques mais de changer la manière dans laquelle vous allez venir les montrer » (SOP 17 [24:03-24:25]).
  - *Ex :* « vous ne pouvez pas bien sûr faire que ces types de hooks là, sinon votre audience va être saturée » (Ep #24 [05:04]).

### Règles sourcées
- Le hook est la porte d'entrée du funnel : sa taille conditionne mécaniquement les résultats de toute la créa. Un hook ne vend pas, il ouvre la porte. (MASTER ACQUISITION / 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES [03:50] : « « le hook c'est la porte d'entrée de notre funnel. Et plus petite est la porte d'entrée, plus petits seront les résultats. Et à l'inverse, plus on a un hook qui est puissant, plus ça va multiplier les chances de réussite »)
- Durée du hook : la fenêtre de capture est de 0.5 à 3 secondes ; on itère en modifiant les 3 à 5 premières secondes (jusqu'à 6 secondes en itération post-Andromeda). Un hook peut être composé de 2 blocs de 2 secondes. (RESSOURCES GOOGLE / 14 (document de la leçon 17) + CRÉATIVE INSIGHT / 24 Ep #42 Doc : section "LE PROBLÈME ACTUEL" ; Ep #42 [05:17] : « Doc : « si vous n'arrivez pas à vous démarquer et à captiver durant les 0.5-3 secondes, vous manquerez l'opportunité de faire de ces prospects vos clients » — Tips : « Modifier les 3 à 5 premières secondes de l'annonce » »)
- Métrique officielle du hook = HOOK RATE (aussi appelé Thumb Stop Ratio) = vues 3 secondes ÷ impressions, à créer manuellement en colonne personnalisée dans le dashboard Facebook. (RESSOURCES GOOGLE / 14 (document de la leçon 17) + MASTER ACQUISITION / 17 [07:52-09:41] : « Doc : « La métrique clé est le HOOK RATE ou aussi appelé Thumb Stop Ratio. Pour configurer cette KPI dans ton dashboard Facebook, crée une vue personnalisée : 3s view video ÷ impressions - % ». Transcription : « on va ve »)
- Barème du hook rate : <25% = FAIBLE, 25-35% = MOYEN, >35% = BON HOOK. Dépend des niches. Références internes : 30% minimum pour espérer une winner, 45% observé sur une ad qui scale, >40% en standard maison. (RESSOURCES GOOGLE / 14 + MASTER ACQUISITION / 17 + CRÉATIVE INSIGHT / 44 Ep #20 + RÉUSSIR SON Q4 / 13 Mastermind SOP 17 [08:36-09:20] ; Ep #20 [00:23] ; Mastermind [1:12:08] : « Doc : « <25% : FAIBLE / 25-35% : MOYEN / >35% : BON HOOK ». SOP 17 : « En dessous de 25% c'est clairement faible... entre 25 et 30 c'est moyen. Ça peut être ok d'avoir un 30% pour du scaling... mais si vraiment vous voul »)
- Le THUMB STOP SCORE est une métrique distincte du hook score : il mesure l'arrêt à 1 seconde et diagnostique la première image / la miniature, pas les 3 secondes. (MASTER ACQUISITION / 36 Processus de testing [08:06] : « « ça a un impact sur les gens que vous allez arrêter et sur votre thumb stop score. C'est-à-dire le pourcentage de personnes qui vont venir s'arrêter au bout d'une seconde. Ok, c'est pas le hook score, c'est les views un »)
- Améliorer le hook de seulement 10% transforme l'économie de la créa : CPM en baisse, CTR en hausse, AOV et CVR inchangés — le ROAS passe de 1.2 à 4.32 sur l'exemple chiffré. (MASTER ACQUISITION / 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES [06:03-07:31] : « « le hook rate... à 20%. Le CPM il est à 10, on a 100 000 impressions, l'AOV il a 50 dollars, le CTR 1%, conversion rate à 2%... ce qui nous fait 1000 clics et un ROAS de 1.2. Maintenant on a la même publicité mais avec  »)
- Le hook doit capter LA BONNE audience, pas n'importe qui : c'est le hook qui fait le targeting et qui signale à l'algorithme le stage d'awareness et l'angle attaqués. (0 to 1 : MASTER ONE / 39 Le Parcours Psychologique des créatives Hook 1/2 [10:21-11:06] : « « le rôle stratégique du hook, il ne sert pas seulement à captiver l'attention. Il sert aussi à indiquer à l'algorithme quel stage d'awareness tu parles et quel angle tu attaques... parce que le hook fait le targeting. E »)
- Le hook doit être accordé au niveau de conscience de l'ad : un hook most aware sur une vidéo problem aware ne fonctionne pas ; l'inverse (hook problem/unaware sur une ad solution aware) est même conseillé. (CRÉATIVE INSIGHT / 61 Ep #7 - 190 Psychological Hooks + CRÉATIVE INSIGHT / 24 Ep #42 Ep #7 [01:06-01:26] ; Ep #42 [02:42] : « Ep #7 : « si vous avez une vidéo qui est focus problem aware, ça va servir à rien de mettre un hook most aware. Il va falloir mettre un hook problem aware ou unaware. Par contre, si vous avez une ad solution aware, c'est »)
- Un hook a exactement 3 rôles : attraper l'attention, faire dire "c'est pour moi", créer une attente (boucle ouverte). Faire seulement arrêter le scroll est un niveau débutant. (0 to 1 : MASTER ONE / 39 Le Parcours Psychologique des créatives Hook 1/2 [01:50] et [03:23] : « « le hook il a trois rôles : un, attraper l'attention ; il doit faire dire que c'est pour moi... et ça doit créer une attente, ça doit créer une boucle ouverte, une question dans la tête du prospect pour qu'il reste... C »)
- Le mouvement est obligatoire dans TOUS les hooks, et il doit être présent dès la première demi-seconde ; on démarre le hook au moment exact où le mouvement entre dans le cadre. (0 to 1 : MASTER ONE / 39 + CRÉATIVE INSIGHT / 45 Ep #21 0-to-1 39 [04:11-04:36] ; Ep #21 [06:02] : « 0-to-1 39 : « il doit y avoir le mouvement direct dans la première seconde. Dans la 0.5 seconde il doit y avoir du mouvement. Très important, c'est le premier hack : tous vos hooks doivent comporter du mouvement. » Ep #2 »)
- Le hook doit être compris en un seul regard : plan serré, un seul point focal, émotion lisible, bon éclairage, texte lisible rapidement. (0 to 1 : MASTER ONE / 39 Le Parcours Psychologique des créatives Hook 1/2 [05:21-06:10] : « « le hook doit être compris en un seul regard. Le cerveau ne doit jamais [avoir à] chercher... on doit avoir un plan serré, on doit zoomer sur ce qu'on doit regarder... Et on doit pouvoir lire facilement l'émotion : on d »)
- Toute boucle ouverte dans le hook doit être refermée dans le body, et de façon satisfaisante. (0 to 1 : MASTER ONE / 39 Le Parcours Psychologique des créatives Hook 1/2 [12:34] : « « On ouvre une question ou peut-être une loop et on la ferme dans la vidéo. Ça, très très important aussi. Vous devez répondre à votre hook dans la vidéo. Sinon vous n'allez pas fermer quelque chose, il va rester une fru »)
- Le hook est responsable de plus de 50% de la performance de l'ad ; sans bon hook, la créa ne peut pas devenir winner. (CRÉATIVE INSIGHT / 24 Ep #42 - 4 types de hooks psychologiques + MASTER ACQUISITION / 17 Ep #42 [07:30] ; SOP 17 [05:41] : « Ep #42 : « le hook, il est vraiment vraiment important. Il fait quasiment tout l'ad. Il est responsable de plus de 50% de l'ad. » SOP 17 : « sur toutes nos créatives qui sont devenues winneuses, qui sont devenues des con »)
- Quand le hook rate est faible, on ne jette pas la créa : on produit un batch de 5 variations de hook sur la même créa en ne changeant que les premières secondes. (MASTER ACQUISITION / 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES [10:02] : « « si vous avez un hook qui est faible, qu'est-ce qu'il va falloir faire ? Il va falloir créer un autre batch de créatifs. Ça veut dire vous allez reprendre votre créatif et vous allez venir créer 5 variations de différen »)
- Liste officielle des 7 leviers pour améliorer un hook rate faible. (RESSOURCES GOOGLE / 14 (document de la leçon 17) — section "Tips pour améliorer ton Hook Rate" + MASTER ACQUISITION / 17 SOP 17 [10:02-12:14] : « « Modifier les 3 à 5 premières secondes de l'annonce / Utiliser une headline d'ouverture différente / Changer le format de ton accroche (boucle ouverte, question, etc.) / Créer une accroche plus dramatique, plus excitant »)
- Volumétrie de production : un vidéo éditeur préparé fait jusqu'à 130 ads/semaine ; prendre une ad et en faire 5 hooks différents prend maximum 1 heure. (MASTER ACQUISITION / 13 Production partie 2 [01:28] : « « nos vidéo éditeurs, si c'est bien préparé, ils font jusqu'à 130 ads par semaine. Donc il y a des variations : par exemple de prendre une ad et faire 5 différents hooks. Ça va prendre une heure maximum par exemple. Ça v »)
- Matrice de production 108 ads : 3 personas × 3 angles × 4 hooks × 3 formats. Le hook se construit à partir des biais du persona et se condense dans les 3 premières secondes ; il ne cherche pas l'attention mais la RECONNAISSANCE. (RESSOURCES NOTION / 20 "Comment créer 108 ads qui convertissent" + CRÉATIVE INSIGHT / 33 Ep #35 Ep #35 [08:36-10:04] : « Notion : « Étape 4 — Transformer l'angle en hook. Le hook est construit à partir des biais propres au persona... Tu condenses ça dans les 3 premières secondes. Tu n'écris pas pour capter l'attention. Tu écris pour provoq »)
- Copy mining : refaire l'ad winner du concurrent à l'identique + 3 variations de hook plus précis = 4 ads. Puis une version qui tente de battre la perf + 3 variations de hook = 4 ads de plus (maximum 30% de changement). (RESSOURCES NOTION / 10 MASTER COPY MINING SOP + CRÉATIVE INSIGHT / 18 Ep #44 Ep #44 [01:52-05:34] : « SOP : « Faire exactement les mêmes ads + 3 variations de hook (plus précis) = 4 ads. Créer des variations de la vidéo (essayer de battre la perf) en améliorant le script ou n'importe quel élément + 3 variations de hook → »)
- Post-Andromeda : toujours faire au minimum 4 variations sur un net new, et itérer les winners en changeant le hook / les 6 premières secondes. La variation n°2 finit souvent par être le vrai winner. (MASTER ACQUISITION / 30 L'algorithme Meta : ce que personne ne te dit [13:56-14:41] : « « à l'intérieur [de l'ad set], tu peux avoir 4 angles, 4 approches différentes, 4 hooks différents, 4 premières 6 secondes différentes... Ce qui se passe souvent, c'est que ta variation numéro 2 finit par être le vrai wi »)
- Mettre du rouge dans le hook : le cerveau limbique est programmé pour s'arrêter sur le rouge (code du danger, repris des panneaux de signalisation). (MASTER ACQUISITION / 17 [SOP] Mini-MasterClass HOOK IRRÉSISTIBLES [11:30-11:52] et [26:14] : « « un autre tip c'est de trouver un moyen de mettre du rouge dans votre hook. Pourquoi le rouge ?... naturellement, instinctivement, le cerveau limbique est fait pour s'arrêter quand il y a du rouge. Tout ce qui est dange »)
- La miniature fait partie intégrante du hook : elle se sélectionne TOUJOURS manuellement, elle doit communiquer clairement l'angle et peut être une image du hook lui-même. Elle impacte directement le thumb stop score. (MASTER ACQUISITION / 36 Processus de testing + MASTER ACQUISITION / 17 Leçon 36 [07:44-08:06] ; SOP 17 [11:08-11:30] : « Leçon 36 : « vous allez toujours venir sélectionner manuellement [la miniature]... une miniature qui communique clairement l'angle de la publicité... il peut s'agir d'une partie du hook. Ça peut montrer une image étrange »)
- Le micro-cravate visible à l'image augmente mesurablement le hook rate (bonus testé). (CRÉATIVE INSIGHT / 24 Ep #42 - 4 types de hooks psychologiques [08:13-08:35] : « « le micro, parce qu'on l'a testé, ça augmente le hook rate. C'est-à-dire de voir quelqu'un qui parle comme moi avec le micro, ça va venir rajouter un % supérieur de hook rate. C'est-à-dire que vous captivez plus facilem »)
- Deux accélérateurs visuels universels : une MAIN visible sur ce qu'on montre, et un VISAGE (idéalement une jolie femme) — efficaces autant sur les hommes que sur les femmes. (CRÉATIVE INSIGHT / 24 Ep #42 + MASTER ACQUISITION / 17 + 0 to 1 / 39 Ep #42 [03:03] et [07:51] ; SOP 17 [30:15] : « Ep #42 : « les mains ça captive toujours l'attention. Peu importe ce que vous montrez, si vous mettez une main dessus, ça va venir captiver encore plus l'attention que sans main. » et « le fait de mettre une femme en hoo »)
- Le texte/caption du hook change tout à visuel identique : c'est lui qui décide quel avatar est capté. (CRÉATIVE INSIGHT / 45 Ep #21 - 8 Hooks Irrésistibles - Partie 1 [03:17-04:06] : « « Le texte c'est une autre partie dans le hook, mais en fait ça change tout. Si je suis sur mon téléphone comme ça, il y a de la peinture qui me tombe dessus et que je mets un texte "comment je suis passé de loser à rich »)
- Un bon créative strategist ne s'invente pas des hooks : il réplique ce que le marché a déjà validé. Les idées sorties de sa tête ont un hit rate très faible. (CRÉATIVE INSIGHT / 45 Ep #21 - 8 Hooks Irrésistibles - Partie 1 [01:04-01:50] : « « tout ce que je vous dis, c'est toujours backé par la data... un bon créatif stratégiste, c'est quelqu'un qui sait juste répliquer ce qui marche. Il n'invente pas de zéro, il n'invente pas de sa tête. J'ai déjà eu plein »)

**Absent du corpus** : MANQUES RÉELS À NE PAS COMBLER PAR INVENTION :

1) Les documents suivants sont CITÉS mais leur contenu N'EST PAS dans le corpus : « 290 Hook Headline basé sur des principes psychologiques » et « Hook Headline Inspiration » (référencés dans RESSOURCES NOTION / 35 Playbook - Les Créatives). Seule la librairie de 190 hooks / 21 frameworks est présente. Le « 🎁 Hook Notion Playbook » annoncé en bonus du document Google de la leçon 17 n'est pas dans le corpus non plus.

2) La « petite bibliothèque » d'exemples de headlines winner montrée à l'écran dans SOP 17 [30:37-31:20] n'est PAS retranscrite : Matteo dit « je vous ai mis aussi quelques exemples de headline winner pour votre hook... je vous les mets en anglais » mais aucune de ces headlines n'apparaît dans le texte. Idem pour la bibliothèque de hooks montrée dans 0-to-1 / 39 [07:42-08:28] (« vous aurez une bibliothèque, la même qu'on utilise... selon les niveaux d'awareness ») : seul un exemple survit, « Three ways this product fights acne problem effectively ».

3) Aucune durée de hook UNIQUE et normée. Le corpus donne des fenêtres différentes selon les leçons : 0.5-3s (doc Google 17), « moins de 3 secondes » (fiche Skool 17), « 3 à 5 premières secondes » (tips d'amélioration), 5s en 2 blocs de 2s (Ep #42), « 1 à 5 premières secondes » pour le signal de pertinence (0-to-1/39), « 6 premières secondes » en itération (leçon 30). Ne pas trancher pour une valeur unique.

4) Aucun barème de hook rate PAR NICHE. Matteo répète « ça dépend des niches » et « il y a des niches où le hook a tendance à être plus élevé » sans jamais donner un seul chiffre par niche.

5) Le calcul du THUMB STOP SCORE est CONTRADICTOIRE dans le corpus : le lexique et la transcription de la leçon 36 disent « les views une seconde divisé par le nombre de clics » (lexique : « Calculé par le nombre de vues à 1 seconde divisé par le nombre de clics ») — ce qui est presque certainement une déformation Whisper de « divisé par le nombre d'impressions », mais rien dans le corpus ne le confirme. Le doc Google de la leçon 17, lui, assimile « Thumb Stop Ratio » au hook rate (3s ÷ impressions). Les deux acceptions coexistent sans arbitrage.

6) Aucun nombre de hooks à tester par créa qui soit unique : le corpus donne 3 (variations en copy mining et chez Thomas dans membres-plus), 4 (par angle dans la matrice 108 ads, et minimum en net new post-Andromeda), 5 (batch de rattrapage d'un hook faible et cadence vidéo éditeur). Reporter le chiffre du process invoqué, ne pas moyenner.

7) Aucune liste de POWER WORDS n'est fournie, alors que le prompt headlines (Notion 43) impose « Utilisent des mots puissants (powerwords) ».

8) Aucune convention de NOMMAGE spécifique au hook. Le naming donné (leçon 36 : « creative testing + mois + numéro de semaine », puis nom du batch type « AD 428v3 ») ne comporte aucun champ hook. La leçon 37 mentionne juste qu'on dispatche « avec les différents hooks » sans format de nom.

9) Le prompt du GPT custom qui génère les hooks (MASTER ACQUISITION / 16) n'est PAS retranscrit — seul son résultat est commenté. De même, dans plusieurs docs Notion, les blocs de code des prompts sont remplacés par « > Chargement du code JavaScript… » / « > Chargement du code Bash… » (Notion 41, Notion 04).

10) Aucun exemple rédigé de hook n'est donné pour plusieurs types : « Révélation surprise » (Matteo dit lui-même « j'ai pas mis d'exemple, je ne le retrouvais plus »), et les exemples visuels des études de cas de SOP 17 [32:12-40:41] sont décrits oralement mais les ads ne sont pas dans le corpus (elles sont dans un dossier Foreplay externe).

11) La fiche Skool de CRÉATIVE INSIGHT / 39 (Ep #24 - 8 Hooks Irrésistibles Partie 2) porte des TIMESTAMPS ERRONÉS (ceux de l'épisode \"Prompt express / avis / framework EPIC\"). Les timestamps utilisables sont ceux de la transcription elle-même, pas ceux de la fiche.

12) Rien dans le corpus ne donne de règle chiffrée sur le nombre de mots d'un hook VIDÉO (la règle « under 7 words » ne concerne explicitement que les headlines de statiques dans le MASTER COPY MINING SOP).


---

## 📜 Scripts — blocs et frameworks

> La formation ne traite jamais un script comme un texte continu : c'est une SUITE ORDONNÉE DE « BLOCS MARKETING » (hook, lead/problème, UMP, discrédit, intro produit, UMS, bénéfices, preuve, objections, offre, urgence, CTA) empruntée aux VSL — une short ad étant « une mini-VSL au fond », c'est-à-dire les mêmes blocs condensés. L'ORDRE n'est pas libre : il suit le parcours psychologique du prospect (captiver → « c'est pour moi » → émotion/gap → rassurer les objections → CTA) et se cale sur son niveau de conscience. Trois frameworks « winner » sont donnés (Direct Response court, Produit-montré-direct, Mini VSL) plus des frameworks satellites complets (Discredit, Villain, Narrative, Apology). Les durées données sont : short ad 30–90 s, narrative 20–60 s, natif répliqué 15–30 s, VSL 3–10 min, plan qui change toutes les 2–3 s. Le CTA doit sonner comme un conseil, jamais un ordre, et se double souvent d'un choix binaire.

### Les 3 frameworks winner de script (issus d'ads ayant généré +500K)
*Source : MASTER ACQUISITION / 11 — Scripter ses ads (Partie 3) [00:01] à [11:20]*

- **Framework 1 — Ad Direct Response courte** — Structure courte pensée pour un achat day-1, adaptable à beaucoup de produits. Séquence énoncée à [00:29] : Hook → Discrédit → Solution (intro produit avec wow effect) → Main benefit (bénéfice principal aligné sur l'angle) → Bénéfices secondaires (rationalisants) → Social proof (+ garantie/scarcité/offre) → Call to action. Cible du très unaware (« le regard des autres ») donc scaling énorme.
  - *Ex :* Exemple t-shirt donné dans la leçon : hook « montrer qu'une femme est folle de ces nouveaux t-shirts » → discrédit « tous les autres t-shirts que vous portez ne sont pas bons » → « ce premier t-shirt est incroyable » → sexy/confortable (angle plaire aux femmes) → flexibles, se portent bien, bons pour la peau, ne se détériorent pas au lavage → « c'est un game changer pour les hommes du monde entier / testé pendant 45 jours sans risque, remboursement, 50% aujourd'hui seulement ». Variante hook si fort problème : « les médecins sont époustouflés par ce masseur révolutionnaire ».
- **Framework 2 — Produit montré directement (solution/product aware)** — Script « un peu plus long qui est aussi banger ». Séquence : Hook = montrer le produit + hero function → USP unique / désir le plus important → mécaniser la feature (feature 1 → bénéfice 1) → UGC qui projette le bénéfice dans la journée type → CTA #1 en plein milieu de vidéo → nouvelle dose (re-montrer produit, autres bénéfices, usage, la différence ressentie) → CTA final. Adapté à un produit simple à comprendre.
  - *Ex :* T-shirt : on tire le t-shirt pour montrer qu'il est élastique ; « il a des fibres ultra élastiques qui permettent d'avoir un fit parfait » ; UGC : « je l'utilise chaque jour pour mes entraînements… ça me prépare pour la journée » ; CTA final : « This is your sign to give it a go ». Variante make-up : montrer l'application sur la peau, « c'est de l'huile de tournesol qui permet d'enlever les rides, je l'utilise une fois par jour et ça enlève mes rides de manière incroyable, je me sens plus jeune ».
- **Framework 3 — Mini VSL / VSL (problème → solution)** — Pour un avatar qui souffre d'un problème. Séquence énoncée à [07:39] : Hook problème → mécaniser le problème (UMP) → agiter le problème → discréditer les autres solutions → introduire l'unique mécanisme de la solution (sans encore nommer le produit) → nommer le produit/la technologie → répondre aux objections → faire visualiser les bénéfices / la vie qui change → social proof (testé par beaucoup, prouvé par des docteurs, testimonials) → urgence/scarcité + offre.
  - *Ex :* Script mains douloureuses cité mot pour mot dans la leçon : « vous luttez contre des maux chroniques aux mains, si vous regardez ceci c'est que vous expérimentez quelque chose qui s'appelle neuropathic nerve erosion » → « c'est une maladie dégénérative qui affecte les nerfs de vos mains… une condition qui s'aggrave jour après jour… plus dure sur les personnes de plus de 60 ans, les diabétiques » → discrédit : « les crèmes, les injections ne marchent pas parce que ça ne traite pas la root cause » → UMS : « une unique combinaison d'impulsions qui vont stimuler les nerfs aux bons endroits et régénérer les cellules endommagées » → objections (« est-ce que c'est dur à utiliser, est-ce qu'il faut une ordonnance ») → visualisation (« il n'aura plus mal aux mains, il pourra reprendre le jardinage, s'occuper de ses petits-enfants ») → social proof (docteurs, testimonials) → urgence (« disponible seulement sur ce lien et pendant un temps limité, 50% de réduction »).

### Liste complète des BLOCS MARKETING d'un script (la grille de décomposition réellement utilisée)
*Source : RESSOURCES NOTION / 30 — Analyse Bangers Ads Flytex (tableau « Bloc Marketing » ↔ « Contenu de l'ads »)*

- **Angle** — Le fil émotionnel / la porte d'entrée choisie pour toute la pub. Un seul par ad.
  - *Ex :* « Retour au sport sans douleur après blessure ou arthrose »
- **Hook (Pattern interrupt)** — Première phrase/image qui arrête le scroll et fait le targeting.
  - *Ex :* « Est-ce que vous avez des douleurs au genou après vos courses ? »
- **Problème (Lead / root cause)** — Nommer précisément le problème et sa cause profonde.
  - *Ex :* « Ancienne blessure, fissure ménisque, arthrose »
- **Contradiction de croyances** — Casser ce que le prospect croyait ou avait déjà tenté.
  - *Ex :* « Vous avez essayé plein de choses… rien n'a fonctionné »
- **Problème quotidien / point de rupture** — Le micro-moment concret où la douleur devient insupportable.
  - *Ex :* « Se demander si on va devoir arrêter la course ou mettre une prothèse »
- **UMP (Unique Mechanism of the Problem)** — Mécaniser le problème : expliquer scientifiquement POURQUOI il arrive.
  - *Ex :* « Inflammation articulaire mal prise en charge / mauvais maintien »
- **Guide / Figure d'autorité** — Celui qui parle et légitime le message (fondateur, docteur, expert).
  - *Ex :* « Hugo, fondateur, ex-blessé lui-même »
- **Agitation / prédiction imminente** — Montrer ce qui arrive s'il ne fait rien.
  - *Ex :* « Arrêter la course à pied, poser une prothèse dans 10 ans… »
- **Discrédit autres solutions** — Démonter les alternatives, sans bullshit, en expliquant pourquoi.
  - *Ex :* « Antidouleurs, séances, genouillères classiques = inefficaces »
- **Réalité / Ennemi commun** — Poser le villain / le constat partagé.
  - *Ex :* « La majorité des coureurs ont mal au genou / aucune vraie solution »
- **Intro produit** — Introduction du produit comme suite logique, avec wow effect.
  - *Ex :* « La compression ciblée comme nouvelle technologie de maintien »
- **UMS (Unique Mechanism of Solution)** — Le mécanisme unique par lequel le produit résout le problème (miroir inverse de l'UMP).
  - *Ex :* « Augmente le flux sanguin + protège sans réduire la mobilité »
- **Bénéfices secondaires** — Les bénéfices additionnels qui rationalisent l'achat.
  - *Ex :* « Plus de plaisir à courir, retrouver la confiance dans ses appuis »
- **Visualisation bénéfices** — Faire vivre la transformation à la 1re personne.
  - *Ex :* « Je recours sans douleur, plus de douleurs au genou »
- **Social proof** — Chiffres, notes, avis, volume de clients.
  - *Ex :* « 80k sportifs aidés, Trustpilot 4.6/5, milliers de commentaires »
- **Offre** — Ce qu'on achète et où.
  - *Ex :* « Maintien de compression disponible sur Flytex.fr »
- **Urgence / Scarcity** — Pression temporelle ou rareté.
  - *Ex :* (Non mentionnée explicitement dans la vidéo Flytex — bloc laissé vide dans le tableau)
- **Bonus** — Cadeau/extra ajouté à l'offre.
  - *Ex :* (Non mentionné dans la vidéo Flytex)
- **Garantie / Risk-free** — Suppression du risque d'achat.
  - *Ex :* (Non mentionné dans la vidéo Flytex ; ailleurs : « testé pendant 45 jours sans risque », « 90 jours », « 180 jours »)
- **USPs / Objection handling** — Traitement des objections et différenciateurs.
  - *Ex :* « Ce n'est pas magique, je fais aussi des exos + je l'utilise pendant et après l'effort »
- **Confiance / Crédibilité** — Ce qui fait qu'on croit le narrateur.
  - *Ex :* « Mon histoire + social proof + transparence d'usage »
- **Bundle / Panier moyen** — Incitation à acheter plusieurs unités pour monter l'AOV.
  - *Ex :* (Non mentionné chez Flytex ; règle donnée ailleurs : « l'AOV est décuplée quand vous montrez d'en acheter 6 à la place de 1 »)
- **Close / CTA** — L'instruction finale.
  - *Ex :* « Rendez-vous sur flytex.fr pour commander votre maintien de compression »

### Le parcours psychologique d'une créative — les 5 étapes obligatoires (squelette universel)
*Source : 0 TO 1 : MASTER ONE / 39 et 40 — Le Parcours Psychologique des créatives (1/2 et 2/2)*

- **Étape 1 — Captiver le cerveau primitif (HOOK)** — 3 rôles : attraper l'attention, faire dire « c'est pour moi », créer une attente / boucle ouverte. Mécaniques obligatoires : du mouvement dès la 0,5 s ; facile à scanner (un seul point focal, plan serré, émotion lisible, bonne lumière) ; contexte immédiat de pertinence dans les 1 à 5 premières secondes. Le hook fait le targeting : il indique à l'algorithme quel stage d'awareness et quel angle.
  - *Ex :* « Les habitants de Chicago ont été sous le choc en découvrant ceci dimanche matin » ; hook curiosité : « J'ai testé un truc que personne n'utilise pour la repousse de barbe » (le barber laisse tomber le produit au ralenti) ; hook aversion à la perte : plein de dentifrices qui tombent dans une baignoire + « arrête de gaspiller ton argent dans ça ».
- **Étape 2 — Répondre à « est-ce que ça me concerne ? »** — Juste après le hook, montrer l'avatar, une douleur, un désir ou une situation dans laquelle il se projette. Erreur classique : montrer un avatar qui n'est pas le sien.
  - *Ex :* Épilateur lumière pulsée ciblant les femmes de +60 ans : « vous n'allez pas venir montrer après le hook des jambes de femmes jeunes… vous allez montrer des jambes de femmes de 60 ans ».
- **Étape 3 — Créer l'émotion (douleur puis désir, et le gap)** — Appuyer la douleur avec des SCÈNES précises (pas des phrases marketing génériques), puis amplifier le désir de transformation en montrant les moments exacts où la vie change, pour créer un gap émotionnel. Plus la vidéo est longue, plus on peut créer de gaps.
  - *Ex :* Douleur : « un jean qui ne ferme plus », « une posture voûtée devant le miroir », « une mauvaise odeur après une longue journée », « une fatigue visible sur le visage ». Désir : « quelqu'un qui remarque son parfum », « une posture droite », « il sourit devant le miroir ». Gap genou : « tu pourrais finir en chaise roulante… quel exemple tu donnes à tes enfants » puis « imagine si tu pouvais rejouer avec tes petits-enfants, ne plus être un fardeau pour ta famille ».
- **Étape 4 — Rassurer le cerveau rationnel (objections) — APRÈS l'émotion** — Le « servo rationnel » s'active seulement après le pic émotionnel : répondre dans l'ordre à « est-ce que ça marche vraiment ? est-ce simple à utiliser ? est-ce que je peux faire confiance ? est-ce que c'est pas trop cher ? est-ce que ça va marcher pour MOI ? ». Moyens : démonstration, simplicité d'usage, social proof, garantie. Trop tôt ou trop tard = vente perdue.
  - *Ex :* Acné : montrer la crème appliquée, l'acné qui part, la peau qui devient belle + « s'ils ne sont pas satisfaits ils ont 180 jours » + « ils vont économiser 200 euros par mois par rapport au Roaccutane ». Pour connaître l'ordre : sondage post-achat « pourquoi t'as acheté / de quoi t'étais sceptique ».
- **Étape 5 — Call to action** — Dire au cerveau quoi faire, en 3 à 7 secondes, sans casser le rythme émotionnel, en ressemblant à un conseil plutôt qu'à un ordre. Ne jamais dire « achetez maintenant ».
  - *Ex :* « Si tu as de l'acné encore et que tu n'arrives pas à la faire partir et que tu veux une méthode naturelle, je te conseille de cliquer là pour voir si c'est encore disponible. Il y a une offre en ce moment, il reste encore du stock. Clique sur le bouton ci-dessous. » / « Si tu veux faire repousser tes cheveux naturellement, clique sur le lien ci-dessous, la promo se termine aujourd'hui. » / Golden nugget : offrir un CHOIX et non un oui/non — « tu vas prendre un pack de 1 ou un pack de 2 ? », « la version classique ou la version avancée ? »

### Ordre de blocs « framework pub qui convertit » (version mastermind, non exhaustif mais « assez logique et qui marche souvent »)
*Source : RÉUSSIR SON Q4 / 13 — Bonus Replay Mastermind #4 (Matteo) [1:23:09] à [1:25:59]*

- **1. Hook** — Captiver l'attention et targeter déjà un acheteur ; mettre les angles en avant dès la première chose vue.
  - *Ex :* Exemple t-shirt anti-transpiration filé sur tout le framework.
- **2. Lead / Problème + mécanisation du problème** — Parler du problème et le mécaniser.
  - *Ex :* « On va venir expliquer qu'il transpire, que ça peut être dérangeant pour la séduction, qu'il cherche une solution, et que les déodorants ça ne fonctionne plus »
- **3. Mécanisation de la solution** — Introduire la solution révolutionnaire et naturelle.
  - *Ex :* « Il existe des solutions naturelles qui fonctionnent, révolutionnaires : c'est des t-shirts »
- **4. Visualisation** — Projeter le résultat jour 1 puis à plusieurs semaines.
  - *Ex :* « Dès le jour 1 où il met le t-shirt, la transpiration va s'arrêter… au bout de plusieurs semaines… tout le monde va leur demander où ils l'ont acheté, ils vont avoir plus de charme »
- **5. Autorité** — Bloc que Matteo dit avoir oublié et qu'il place ici.
  - *Ex :* « Ce t-shirt a été développé par un top ingénieur suisse »
- **6. Social proof** — Volume d'utilisateurs et note.
  - *Ex :* « Des milliers d'hommes utilisent ce t-shirt, il est noté 4,8 sur 5 »
- **7. Réduction des objections** — Contrer l'esprit rationnel qui cherche une raison de ne pas acheter.
  - *Ex :* « Est-ce que ça fonctionne vraiment ? est-ce que ça fonctionne pour moi ? peut-être que ça va pas tenir »
- **8. Urgence / Scarcity** — Offre du jour + rareté justifiée.
  - *Ex :* « Il n'y en a plus beaucoup en stock, parce qu'on produit en Suisse, on ne produit pas en masse, ça coûte cher, donc il ne reste que quelques stocks »
- **9. Call to action** — Dire au cerveau quoi faire.
  - *Ex :* « C'est bête, mais : cliquez sur le bouton pour obtenir le vôtre »

### Structures de script selon le niveau de conscience (le hook et l'ordre changent, pas le stock de blocs)
*Source : MASTER ACQUISITION / 02, 03, 04, 05 — Les différents niveaux de conscience #1 à #4, + 11 [11:46]-[12:10], + RÉUSSIR SON Q4 / 13 [46:36]-[49:05]*

- **Most Aware** — Structure la plus courte : Hook → révéler directement le produit → testimonials → CTA. Facteurs gagnants : timing et meilleure offre. Peu scalable mais gros spend possible si l'amont a été travaillé.
  - *Ex :* « On a repris notre créative qui marchait le mieux et on est venu mettre au départ de la créative : c'est notre meilleure offre de tous les temps, vous achetez et vous avez un cadeau plus 60% de réduction » — plus de 500K de spend sur cette seule créative.
- **Product Aware** — Hook → solution directe → construire le trust / autorité → discréditer les autres marques → prouver la supériorité → social proof → CTA. Sans discrédit ni explication du pourquoi le vôtre est mieux, « vous allez manger pas grand chose ».
  - *Ex :* « On a un nom, deux études qui le prouvent, que ça peut skyrocketer votre métabolisme » ; ad listicle négatif « pourquoi ils regrettent d'acheter ceci » qui cible ceux qui connaissent la marque.
- **Solution Aware** — Parler du problème → discréditer les AUTRES SOLUTIONS (pas les autres marques) → introduire votre catégorie de solution → puis retomber sur la structure product aware.
  - *Ex :* Hack de phrase donné mot pour mot : « La plupart de ceux qui veulent éviter de perdre leurs cheveux utilisent des pilules ou des brosses. Le problème avec ça, c'est que la perte de cheveux ne se résout pas avec une brosse, ça masque seulement le problème. » / « Le problème avec les pilules, c'est que ça crée un autre problème : des effets secondaires, ça fait grossir, ça peut donner des maladies cardiaques. » Puis : « 3 raisons pour lesquelles les pilules ne sont pas la meilleure solution pour faire repousser les cheveux » → « il existe une solution naturelle… c'est le shampoing ».
- **Problem Aware** — Parler du problème EN EXPERT → mécaniser le problème → appuyer les douleurs du quotidien jusqu'à ce qu'elles deviennent grosses → introduire la solution comme inévitable → nommer l'unique mécanisme de la solution (inverse du mécanisme du problème) → introduire le produit → social proof / avant-après subtils.
  - *Ex :* « La perte de cheveux touche 80% de la population… c'est l'alopécie, une maladie dégénérative… due à un problème de circulation du sang dans le crâne » → douleurs : « pour les femmes c'est une perte de féminité, difficile de trouver un conjoint, chaque fois qu'on se regarde dans le miroir on se sent mal » → « vous devez absolument restimuler la circulation sanguine dans votre crâne » → « le meilleur moyen c'est un shampoing qui réactive naturellement la circulation sanguine ».
- **Unaware** — Le plus scalable et le plus difficile : il faut éduquer sur le problème, ou raconter une histoire très large qui touche tout le monde, puis descendre couche par couche jusqu'au produit. Nécessite des vidéos plus longues (VSL).
  - *Ex :* VSL de 7 minutes citée : « Depuis 300 ans, ces femmes japonaises plongent sans masque à oxygène et sans équipement pour aller collecter des perles… » → introduction du problème (ronflement) → mécanisme → discrédit des autres solutions → produit → offre. Autre exemple : « voici l'histoire d'un petit Américain, il n'arrivait pas à avoir autant de force que les autres… »
- **Aware de la marque mais pas chaud (« stage niveau 6 »)** — Stage mentionné en plus des 5 classiques : les gens qui connaissent la marque, ont peut-être acheté ou hésité, et ne sont pas chauds. On les attaque avec un angle négatif.
  - *Ex :* Listicle négatif : « Pourquoi ils regrettent d'acheter ceci » — « le fait d'avoir un angle négatif, ça va dire ok, j'avais raison. Et au final, on peut convertir certains d'entre eux ».

### Framework DISCREDIT — script complet section par section (product aware)
*Source : RESSOURCES NOTION / 14 — Discredit (référencé par CRÉATIVE INSIGHT / 26 Ep #36). Concept : UGC raw, VO naturelle, B-roll iPhone naturel*

- **HOOK (Pattern Interrupt)** — Stopper le scroll avec une phrase choc et inattendue + targeter product aware.
  - *Ex :* « Don't buy the Space Buddy. »
- **CONTEXT + VIRALITY (Familiarity Proof)** — Créer un effet de reconnaissance et montrer que le produit est populaire.
  - *Ex :* « Now, you've probably seen this little astronaut all over the internet on TikTok, on Amazon, on Google, and a bunch of places. »
- **WARNING + TRUST (I'm protecting you)** — Se positionner comme quelqu'un qui protège le spectateur d'une erreur + garder l'attention.
  - *Ex :* « And if you're thinking of buying one, watch this before you buy because I've been scammed before, and I don't want you to make the same mistake. »
- **PROBLEM (Original vs Knockoffs)** — Introduire le vrai problème : le marché est rempli de copies.
  - *Ex :* « Now, there's the original Space Buddy, and then there's a bunch of cheap knockoffs. »
- **UNCERTAINTY (You can't tell)** — Créer du doute et rendre le spectateur dépendant de ton explication.
  - *Ex :* « Now, even if you buy the knockoff, you might not notice because you don't know what the original looks like. »
- **AUTHORITY + PROOF SETUP (I have both)** — Asseoir l'autorité en montrant que tu as comparé les deux versions.
  - *Ex :* « But I have both, and let me tell you, the difference is crazy. »
- **DEMONSTRATION (Show the knockoff)** — Identifier clairement la mauvaise version visuellement + top bénéfice émotionnel ou technique.
  - *Ex :* « This is a knockoff. »
- **DEMONSTRATION (Show the original)** — Créer un contraste immédiat avec la vraie version + top bénéfice émotionnel ou technique.
  - *Ex :* « Now, here's the original. »
- **QUANTIFIED DIFFERENCE (Specific claim)** — Rendre la supériorité tangible avec un bénéfice mesurable.
  - *Ex :* « Do you notice the original is about three times brighter? »
- **UNIQUE MECHANISM (Why it's better)** — Donner une raison logique et crédible à la supériorité du produit.
  - *Ex :* « That's because they're using a patented LED technology owned by Plushy. »
- **VILLAIN MECHANISM (Why knockoffs suck)** — Créer un « méchant » responsable de la mauvaise qualité.
  - *Ex :* « And the knockoffs use some cheap Chinese light. »
- **PERMISSION / SOFT DISQUALIFIER (Reverse psychology)** — Réduire la pression de vente et rendre le choix premium plus désirable.
  - *Ex :* « So, if you want to save money and get a lower quality product, that's completely fine. »
- **EMOTIONAL REASON (Gift identity)** — Passer de la logique à l'émotion et à l'identité personnelle.
  - *Ex :* « But for me, I know I want to give the best gift this year, so I'll stick with the original. »
- **CTA + WHERE TO BUY (Source control)** — Diriger clairement vers l'action et associer l'original à la marque.
  - *Ex :* « Anyways, just wanted to let you guys know, if you want the original, get it from Plushy. »
- **SCARCITY OF SOURCE (Only here)** — Éviter les copies des marketplaces et pousser à acheter via la source officielle.
  - *Ex :* « It's only available on their website at … »

### Framework VILLAIN (« Jeter la pierre au villain ») — 7 blocs, 1 phrase par bloc, script 30–60 s
*Source : RESSOURCES NOTION / 18 — Jeter la pierre au villain, tips de film (référencé par CRÉATIVE INSIGHT / 31 Ep #33)*

- **HOOK** — Phrase d'arrêt immédiat + soulagement (déculpabilisation).
  - *Ex :* « Si tu n'arrives pas à perdre du gras, ce n'est pas un manque de discipline. »
- **VILLAIN INTRO** — Désigner clairement l'ennemi et la trahison. Le villain peut être : une habitude, une croyance, une ancienne solution, une industrie, une norme acceptée.
  - *Ex :* « On t'a appris à manger moins, bouger plus, et te blâmer quand ton corps ne suivait pas. » Formule clé : « Ce n'est pas ta faute si X… C'est parce que Y t'a appris à faire Z. »
- **UMP (Unique Mechanism Promise)** — Promesse nouvelle, non évidente ; reframe du problème.
  - *Ex :* « La perte de graisse durable dépend du moment où ton corps est autorisé à brûler, pas de ta volonté. »
- **UMS – HERO (Solution)** — Explication simple du mécanisme unique + sensation de facilité.
  - *Ex :* « En réajustant le timing alimentaire, ton métabolisme bascule naturellement en mode brûlage, sans forcer. »
- **PROOF** — Preuve douce, crédible, observation réelle.
  - *Ex :* « C'est exactement ce que vivent ceux qui arrêtent de se restreindre et laissent enfin leur corps faire le travail. »
- **AUTHORITY** — Autorité logique ou scientifique, sans claims risqués.
  - *Ex :* « Ce mécanisme est basé sur des principes fondamentaux de physiologie métabolique utilisés par les experts en nutrition. »
- **CTA (soft)** — Invitation sans pression ; le Hero est une issue, pas une injonction.
  - *Ex :* « Si ton corps n'a jamais répondu aux régimes, c'est peut-être parce qu'il attendait la bonne méthode. »

### Framework NARRATIVE ADS (UGC scripté qui raconte une histoire) — 20 à 60 s
*Source : RESSOURCES NOTION / 21 — Narrative Ads + CRÉATIVE INSIGHT / 35 Ep #29*

- **Hook face caméra qui intrigue** — Commencer calmement : un hook simple face caméra surperforme souvent les ouvertures agressives. Idéalement une phrase clé tirée du script, intrigante.
  - *Ex :* Testostérone : « Comment je suis passé de coucher 3 fois par mois avec ma femme à 5 fois par semaine »
- **L'histoire qui valide l'expérience du spectateur** — L'histoire doit valider l'expérience du spectateur AVANT de proposer une solution. Un seul angle / une seule Big Idea.
  - *Ex :* « Avec ma femme c'était 3 fois par mois, souvent elle se retournait le soir dans le lit, ça me frustrait… je ne me sentais pas puissant, je n'étais pas focus »
- **Découverte naturelle du produit** — Le produit est introduit comme une découverte, pas comme une vente forcée. Moment « j'aurais aimé savoir ça plus tôt ».
  - *Ex :* « Jusqu'à ce que je tombe sur une pub de ce complément testostérone, j'étais un peu sceptique et franchement pour moi ça a super bien marché »
- **CTA type conseil à un ami** — « Quand tu vends, parle comme si tu donnais un conseil à un ami, pas comme si tu annonçais une promo. »
  - *Ex :* « Voilà l'offre, en plus de ça c'est sans risque pendant 45 jours »
- **Contraintes de production associées** — Minimum de b-roll (produit en main, porté, en mouvement réel). Décors listés : assis sur un banc (parc, trottoir), à la maison (chambre, salon, en train de s'habiller), salle de bain (miroir, après la douche), devant une fenêtre (lumière naturelle, fond neutre), bureau à domicile, voiture à l'arrêt si calme et lumière naturelle.
  - *Ex :* « Acteur IA sur un banc qui parle, acteur IA dans une chambre, acteur IA dans une voiture — et diversité »

### Longueurs et durées de script données par la formation
*Source : MASTER ACQUISITION / 12 [05:59], RÉUSSIR SON Q4 / 13 [1:04:44] et [1:05:04], CRÉATIVE INSIGHT / 35 [03:05], RESSOURCES NOTION / 09, CRÉATIVE INSIGHT / 50 Ep #11, MASTER ACQUISITION / 06 [11:32]*

- **Short ad** — 30 à 90 secondes.
  - *Ex :* « Donnez-lui un script assez simple, pas trop compliqué, d'une ads assez short, 30 à 90 secondes »
- **Short ads courtes de référence interne** — 60 secondes.
  - *Ex :* « Nous, souvent pour des ads courtes qui durent 60 secondes… »
- **Narrative ads** — 20 à 60 secondes maximum. « La clarté bat toujours la longueur. »
  - *Ex :* « Idéalement je conseille entre 20 à 60 secondes maximum, après il faudrait être fort pour tenir toute une longue histoire »
- **Réplication d'un format organique (NATS)** — 15 à 30 secondes max pour la structure complète du script.
  - *Ex :* Prompt : « La structure complète du script (15 à 30 secondes max) »
- **Ad style Temu / native démonstration** — Entre 15 et 30 secondes, bénéfice clé compris dans les premières secondes.
  - *Ex :* « Il faut que le bénéfice le plus fort du produit se comprenne dans les premières secondes… et que ça dure entre 15 et 30 secondes »
- **VSL longue** — Plus de 3 minutes ; en général entre 3 et 10 minutes.
  - *Ex :* « Longue vidéo, je dirais plus de 3 minutes. Donc on fait en règle générale entre 3 et 10 minutes »
- **Rythme interne (durée d'un plan)** — Changement de plan toutes les 2 à 3 secondes (méthode Marvel) ; jamais un plan fixe de 5 secondes. La checklist avancée vérifie que toutes les scènes font bien la durée prévue (exemple donné : 3 secondes).
  - *Ex :* « Est-ce que toutes les scènes sont de 3 secondes ? Ah bah non, en fait on a une scène qui dure 5 secondes. Ça, ça doit directement changer. »
- **Fenêtre du hook** — Mouvement dans la 0,5 seconde ; hook compris en 1-2 secondes ; pertinence pour l'avatar comprise dans les 1 à 5 premières secondes ; mesure = 3 secondes view / impressions.
  - *Ex :* « Dans la 0.5 seconde il doit y avoir du mouvement » / « dans les 1 à 5 premières secondes, il doit comprendre que ça parle pour lui »
- **Fenêtre du CTA** — Doit être compris en 3 à 7 secondes.
  - *Ex :* « Vous êtes compris en 2 à 5, 7 secondes. Plutôt 3, 7 secondes. »

### Variantes de script par type de contenu à couvrir (pack d'annonces post-Andromeda)
*Source : MASTER ACQUISITION / 41 — Scaler post-Andromeda, playbook complet (3/4) [00:20] à [05:30]*

- **UGC témoignage / story de créateur** — Créateur qui témoigne, raconte son histoire, pourquoi il a acheté. Très authentique, très « ugly », sans montage.
  - *Ex :* « Beaucoup de témoignages comme ceci, beaucoup de vidéos très authentiques, très ugly, sans montage »
- **Founder / brand story** — Indispensable en 2025-2026 : créer une connexion émotionnelle et expliquer le WHY, parce que l'algorithme rend le prospect instantanément aware de toutes les solutions.
  - *Ex :* « Moi, j'ai créé Evian parce que je voulais aider toutes les personnes qui ont mal au dos comme moi j'étais »
- **Fake screenshot / ugly ads** — Ressembler à ce que les gens envoient dans leur fil.
  - *Ex :* « Moi j'ai acheté cette bouteille d'eau parce que je voulais quelque chose qui m'empêche d'avoir mal au dos. Et ça marche bien. J'adore la brand… »
- **Us vs Them / discrédit** — Le hack marqué « en rouge » : comparer et discréditer les autres solutions. Idéalement PAS à la première personne au sens « choisissez mon produit ».
  - *Ex :* « Vous hésitez entre la San Pellegrino ou l'Evian ? Là-dedans je vais vous expliquer laquelle est mieux pour moi qui souffre de problèmes de dos » — « c'est pas 'choisir mon produit', c'est 'j'ai testé et je conseillerais la marque Evian' »
- **Before / after + social proof** — Montrer les résultats, prouver que ça marche pour vous et pour les autres.
  - *Ex :* Ad InnoSupps citée : « par rapport à l'original, ils ont placé un avant-après en début de l'ad, et là c'était une ad banger… elle a tourné pendant deux ans »
- **Offres / promotions** — Images très simples avec l'offre, la date de fin et le stock bas.
  - *Ex :* « Votre bouteille Evian, moins 50% aujourd'hui, ça se termine aujourd'hui. On est actuellement avec du stock bas, on va être bientôt en rupture »
- **Ads objections** — Vidéos entières dédiées à répondre aux plus grosses objections.
  - *Ex :* « Pour la bouteille Evian peut-être : oui, mais le verre c'est lourd à transporter. Et là vous faites des ads où vous expliquez. »

### Leviers de script qui remplacent une section (concepts documentés, à insérer dans le squelette)
*Source : RESSOURCES NOTION / 15 (Bypass principle), 22 (Curiosity + Reverse Psychology), 08 (Official Apology Statement), CRÉATIVE INSIGHT / 13 Ep #48*

- **Bypass Principle (preuve visuelle)** — Ne pas affirmer que ça fonctionne : montrer la transformation en train de se produire. Pattern universel : État AVANT → Action / Démo → État APRÈS visible, sans commentaire explicatif. Action recommandée : ajouter plus de proof et d'avant-après dans les 20 premières (secondes).
  - *Ex :* « Affirme → prouve-le. Les démonstrations court-circuitent le scepticisme. »
- **Curiosity + Reverse Psychology** — Ouvrir sur une affirmation qui contredit ce que l'audience croit (« That can't be right… »), pousser à l'inverse (« Go ahead, keep doing what you're doing… »), laisser un trou de logique, puis atterrir sur un insight qui réoriente. Chaque concept doit livrer : Big Idea / Premise, Narrative Angle ou Hook, Mécanisme psychologique, Formats suggérés.
  - *Ex :* Sortie attendue : 3 concepts d'ads, chacun commençant par un hook qui déclenche la curiosité, utilisant la reverse psychology, et finissant sur un insight contre-intuitif.
- **Official Apology Statement** — Format natif texte, 9 sections dans un ordre précis (le détail des 9 sections n'est pas capturé dans le corpus, voir « absent »). Leviers empilés : pattern interrupt total (warning sign + « OFFICIAL APOLOGY »), curiosity gap (« we lied »), double-bind reveal (le mensonge est en fait une meilleure offre), Yes Ladder (6-8 affirmations factuelles consécutives), reverse psychology sur la scarcity.
  - *Ex :* Règles anti-fail : ne jamais commencer par « BUY NOW » ; jamais plus de 2 emoji ; jamais « you » agressif ; ne jamais oublier la Yes Ladder ; ne jamais inventer le « lie » ; toujours finir par « If you're still seeing the link, there's still stock » ; bold 3-4 phrases max par paragraphe.
- **Listicle (et listicle négatif)** — Format de script en liste, plus court plutôt que long pour laisser le temps de lire, scène qui change toutes les 2 secondes, ton un peu drôle, rendu UGC. Moins de 30 secondes.
  - *Ex :* « Pourquoi ils regrettent d'acheter ceci » — cible ceux qui sont aware de la marque et product aware.
- **POV du problème (animation)** — Ce n'est pas quelqu'un qui parle, c'est le problème lui-même qui parle. Fonctionne parce que le dessin animé fait baisser les armes du cerveau (registre récréatif, pas commercial).
  - *Ex :* « On introduit les méchants, on mécanise très bien… ça change de scène toutes les deux-trois secondes »
- **Texte défilant / TikTok love letter** — Format court avec un texte que les gens lisent, une musique. Peut être testé plus long, déroulé comme un carrousel, ou avec une image à la place d'une vidéo. Donne en général de très bons CPM.
  - *Ex :* « C'est comme si on raconte une histoire, c'est le format TikTok love letter »

### Système de démultiplication d'un script (comment un script devient des dizaines de créas)
*Source : RESSOURCES NOTION / 20 — Comment créer 108 ads qui convertissent ; RESSOURCES NOTION / 17 — Tourner 1 ads winneuse en 10 ; RÉUSSIR SON Q4 / 13 [1:42:37]-[1:50:44] ; MASTER ACQUISITION / 10 [06:17]*

- **Formule 108 ads** — 3 angles par persona × 4 hooks par angle × 3 formats par hook, sur 3 personas = 108 publicités uniques. Chaque pub est assez différente visuellement pour éviter le regroupement « Entity ID » de Meta.
  - *Ex :* Personas construits sur le comportement, pas la démographie : Le sceptique, L'acheteur pressé, L'aspirationnel, Le pain-aware.
- **1 winner → 10 variations** — Même script, même angle, nouveaux b-rolls, endroits différents avec 3 acteurs similaires (voiture / outdoor / chambre / autre endroit) → « même ads mais nouveau look ». Plus 5 nouveaux hook patterns par ad, même angle mais plus spécifique.
  - *Ex :* « New 5 new Hook pattern pour chaque ads, même angle mais plus spécifique »
- **Itération scientifique au niveau ad** — Une seule itération isolée à la fois : tester différents hooks / visuels / angles / messages ; DÉPLACER ou AJOUTER des blocs marketing ; changer d'acteur et de voix ; adapter aux codes TikTok. Puis phase level 2 : combiner le meilleur hook + le meilleur angle + le meilleur acteur.
  - *Ex :* « Ok, sur votre créa, peut-être qu'il manque du social proof. Ça fait quoi sur mon test d'ajouter du social proof ? Mais à nouveau, un changement à la fois. »
- **Test massif d'angles/messages en statique** — Entre 3 et 5 variations pour un angle, puis 5 à 10 concepts d'angles testés. Les messages gagnants sont ensuite injectés en hook sur les meilleures ads vidéo.
  - *Ex :* « Sur 5 tests, on a obtenu 3 angles winners. Et sur ces angles winners, il y avait une headline, un message, qui résonnait fortement. »
- **Taille d'un batch de créa** — Ne pas se limiter à 4 : faire 8, 12. Demander au creative strategist au minimum 4 à 5 batchs par semaine de copies de scripts de compétiteurs.
  - *Ex :* « Quand vous faites un batch de créa, n'ayez pas peur, à la place de 4, de faire 8, 12. Ça coûte pas grand-chose de tester si ça peut vous rapporter un big winner. »

### Règles sourcées
- Un script ne s'écrit jamais d'un bloc : on le décompose en « blocs marketing » (la grille vient des VSL) et on écrit bloc par bloc. (MASTER ACQUISITION / 10 — Scripter ses ads (Partie 2) [00:22] et [07:02] : « Ce que je fais c'est que je lui dis de décomposer en bloc marketing selon ces blocs marketing que je lui donne et moi. Donc ça c'est mes blocs marketing qu'on utilise dans les VSL. […] Donc ça c'est le secret de comment  »)
- Pourquoi décomposer : bloc par bloc est plus simple à comprendre et à adapter que la vidéo entière. (MASTER ACQUISITION / 10 — Scripter ses ads (Partie 2) [04:12] : « Et le script que j'avais envoyé c'était celui là. Donc en fait pourquoi on décompose en bloc ? Parce que ça va être beaucoup plus simple de comprendre et de faire bloc par bloc que de voir toute la vidéo en un seul bloc. »)
- L'ORDRE des blocs n'est pas libre : c'est une série de blocs psychologiques dans un ordre donné qui déclenche la décision. On ne commence jamais par un CTA, on finit par lui. (MASTER ACQUISITION / 07 — Créer un condor (Partie 2) [06:47] et [07:08] : « C'est-à-dire, on ne peut pas mettre certains blocs marketing dans l'ordre qu'on veut. On doit avoir un certain ordre pour faire prendre une décision. Et ça, c'est logique. Mais on ne commence pas par un call to action. A »)
- L'ordre correct est celui du timing psychologique de l'acheteur : d'abord la confiance, puis le désir, puis les objections. Mettre un bloc au mauvais moment casse la vente même si le contenu est bon. (RÉUSSIR SON Q4 / 13 — Bonus Replay Mastermind #4 (Matteo) [47:39] à [48:42] : « Il n'y a pas des ordres précis, précis, mais dans l'ensemble, ça se rapproche tout le temps. Ça ne vaut pas trop le coup de mettre discrédit tout à la fin parce que c'est les premières choses qui vont se poser. […] Si là »)
- Le framework court « Direct Response Winner » a exactement 7 blocs : hook, discrédit, solution, bénéfice principal, bénéfices secondaires, social proof, call to action. (MASTER ACQUISITION / 11 — Scripter ses ads (Partie 3) [00:29] : « C'est une structure, c'est un framework, c'est que ça se compose de hook, ça discrédite, solution main-benefit, user-benefit [bénéfices secondaires], social proof et call to action. »)
- Le hook a trois rôles cumulés, pas un seul : attraper l'attention, faire dire « c'est pour moi », créer une attente (boucle ouverte). (0 TO 1 : MASTER ONE / 39 — Le Parcours Psychologique des créatives Hook 1/2 [01:50] : « Donc le hook il a trois rôles, c'est un : attraper l'attention, il doit faire dire que c'est pour moi, ok ? C'est-à-dire que la personne se dit ok, ça va me concerner, et ça doit créer une attente. Ça doit créer une bouc »)
- La boucle ouverte du hook DOIT être refermée dans le corps de la vidéo : le body doit répondre exactement à la promesse du hook. (0 TO 1 : MASTER ONE / 39 — Le Parcours Psychologique des créatives Hook 1/2 [12:34] : « Vous devez répondre à votre hook dans la vidéo. Sinon vous n'allez pas fermer quelque chose, il va y rester une frustration. Et ça doit être satisfaisant. Très très important. Si vous dites les trois méthodes qui permett »)
- Le bloc immédiatement après le hook doit répondre à la question inconsciente « est-ce que ça me concerne ? » en montrant l'avatar exact, sa douleur ou son désir. (0 TO 1 : MASTER ONE / 40 — Le Parcours Psychologique des créatives 2/2 [00:21] à [01:25] : « Cette question là va venir à ce moment là : est-ce que ça me concerne ? […] Une technique très simple c'est soit de montrer l'avatar de votre personne, rapidement, qui a un problème, une douleur, un désir, ou d'être très »)
- La douleur ne se raconte pas en phrases marketing : elle se prouve par des SCÈNES précises. Le script est moins important que les footages qui prouvent. (0 TO 1 : MASTER ONE / 40 — Le Parcours Psychologique des créatives 2/2 [02:48] : « Il y a le levier de la douleur. Il a une douleur, il a un problème. Et nous, on va venir appuyer dessus. Pas avec des phrases marketing génériques, ce que font beaucoup de personnes, mais avec des scènes précises. Ce qu' »)
- Il faut créer un GAP émotionnel : descendre très bas sur la douleur puis remonter très haut sur la transformation. Plus le gap est grand, plus l'envie d'acheter est forte. Une vidéo longue peut enchaîner plusieurs gaps. (0 TO 1 : MASTER ONE / 40 — Le Parcours Psychologique des créatives 2/2 [05:47] à [07:14] : « Et on va créer un gap émotionnel. Donc ça dépend de votre vidéo. Plus elle est longue, plus vous pourrez créer de gap. […] Plus le gap est grand, plus l'envie sera forte. C'est pour ça qu'il faut maîtriser les deux parti »)
- Le produit doit arriver comme une SUITE LOGIQUE de ce qui vient d'être dit, pas comme une rupture. (0 TO 1 : MASTER ONE / 40 — Le Parcours Psychologique des créatives 2/2 [07:35] : « Et ensuite, on introduit le produit. Et le produit doit être une suite logique par rapport à ce que vous dites. […] Ça veut dire que votre produit, par rapport à la douleur, par rapport à pourquoi il n'arrive pas à se so »)
- Les objections se traitent APRÈS le pic émotionnel, jamais avant. Trop tôt ou trop tard = vente perdue. Elles doivent être traitées dans l'ordre de priorité du prospect (obtenu par sondage post-achat). (0 TO 1 : MASTER ONE / 40 — Le Parcours Psychologique des créatives 2/2 [10:06] et [12:18] : « Il y a trop de personnes qui le font dans l'ad même avant. Ça arrive après l'émotion. C'est après l'émotion que ce servo-là va s'activer et vous devez le rassurer ici. Et si vous le rassurez trop tard, vous perdez la ven »)
- Le CTA doit ressembler à un conseil, pas à un ordre, être compris en 3 à 7 secondes, et ne pas casser le rythme émotionnel. Jamais « achetez maintenant ». (0 TO 1 : MASTER ONE / 40 — Le Parcours Psychologique des créatives 2/2 [13:24] : « Il faut juste pas que ça fasse trop vendeur. Il faut pas lui dire achète maintenant. […] Vous êtes compris en 2 à 5, 7 secondes. Plutôt 3, 7 secondes. C'est simple et logique. Ça ne va pas casser le rythme émotionnel. Et »)
- Golden nugget CTA : ne pas donner un choix oui/non mais un choix entre deux options, pour réduire la résistance mentale et activer la projection. (0 TO 1 : MASTER ONE / 40 — Le Parcours Psychologique des créatives 2/2 [14:08] à [15:36] : « Le call to action ne fait pas décider s'il faut décider, mais quoi. […] À la place de dire 'mange ton kiwi', vous allez dire 'tu préfères le kiwi ou l'orange'. […] Donc à la fin : ok, là avec ce deal qui est en cours, tu »)
- On met souvent DEUX CTA dans une créa : un CTA subtil au milieu et un CTA final. Au-delà, ça fait spam. (RÉUSSIR SON Q4 / 13 — Bonus Replay Mastermind #4 (Matteo) [49:05] : « Ensuite, comment le call to action : ça se fait de mettre plusieurs call to action dans une créa. Peu de personnes le font, mais ça marche très bien. […] Si vous mettez des call to action partout, ça va faire spam. Mais  »)
- Le CTA est le levier AOV : y intégrer l'incitation à acheter plusieurs unités/packs. (MASTER ACQUISITION / 10 — Scripter ses ads (Partie 2) [07:27] et [07:56] : « Pour booster votre AOV, vous pouvez inciter à acheter plus de packs, plus de produits dans le call to action dans l'ad. […] L'AOV est décuplée quand vous montrez d'en acheter 6 à la place de 1. »)
- Le CTA peut être visuel et non parlé : ChatGPT ne le voit pas quand il décompose un script concurrent, il faut le rajouter manuellement. (MASTER ACQUISITION / 10 — Scripter ses ads (Partie 2) [07:02] : « Ensuite le CTA, ben il ne le met pas mais vous voyez qu'il le met de manière visuelle. Donc ça lui il ne le voit pas. »)
- Une short ad EST une mini-VSL : mêmes blocs marketing, condensés. Une VSL = beaucoup de blocs sur une longue vidéo (plus de 3 minutes, en général 3 à 10 min). (RÉUSSIR SON Q4 / 13 — Bonus Replay Mastermind #4 (Matteo) [1:04:44] et [1:05:04] : « Mais en fait, une short ad, c'est une mini-VSL au fond. Une VSL, c'est simplement tu vas venir mettre beaucoup de blocs marketing sur une longue vidéo, et sur une courte vidéo, tu peux le condenser. Longue vidéo, c'est q »)
- On rend un script plus scalable en AJOUTANT des couches en amont (parler du problème, mettre de l'autorité), pas en changeant de concept. (RÉUSSIR SON Q4 / 13 — Bonus Replay Mastermind #4 (Matteo) [44:31] à [44:51] : « Si vous avez une ad, un script qui marche bien, essayez de venir ajouter quelques couches pour toucher plus d'audience. […] Nous, souvent pour des ads courtes qui durent 60 secondes, on avait une première ad qui marchait »)
- C'est le début de l'ad qui détermine le niveau de conscience ciblé : on ajoute ou on retire les couches d'entrée pour changer de stage. (MASTER ACQUISITION / 04 — Les différents niveaux de conscience #3 [08:19] et [08:43] : « Si vous avez une ad winneuse, vous allez venir rajouter des couches. C'est-à-dire, si vous avez une ad, venez parler du problème. Ou enlevez le problème, essayez de commencer directement en discréditant les autres soluti »)
- Le discrédit ne doit jamais être du bullshit : on explique POURQUOI l'autre solution n'est pas la meilleure (plus lente, plus d'inconfort, plus de risque d'échec). (MASTER ACQUISITION / 03 — Les différents niveaux de conscience #2 [07:23] à [08:06] : « Idéalement, pas de bullshit. On ne va pas venir dire que c'est nul. On explique pourquoi. On explique que ce n'est pas la meilleure solution pour résoudre le problème. Ou d'une autre manière, ce n'est pas la solution qui »)
- Le bénéfice principal doit être aligné sur l'angle ; les bénéfices secondaires servent à RATIONALISER un achat déjà émotionnel. (MASTER ACQUISITION / 11 — Scripter ses ads (Partie 3) [02:15] et [02:37] : « Ensuite on va parler des bénéfices principaux, donc les plus importants au niveau du message et au niveau de l'angle. […] C'est les bénéfices qui rationalisent, c'est-à-dire on achète par l'émotionnel donc on achète parc »)
- En fin de script, on empile : social proof + suppression du risque + scarcité + offre du jour. « On met la dose au niveau copywriting. » (MASTER ACQUISITION / 11 — Scripter ses ads (Partie 3) [03:02] : « Ensuite on rajoute encore tout ce social proof, donc c'est un game changer pour les hommes du monde entier. Testez pendant 45 jours sans risque, si vous n'êtes pas satisfaits ils vous donneront un remboursement, 50% aujo »)
- Chaque affirmation du script doit être précise par rapport à l'avatar réel : ne pas reprendre les chiffres et cibles du script source. (MASTER ACQUISITION / 11 — Scripter ses ads (Partie 3) [08:24] : « C'est plus dur sur les personnes de plus de 60 ans, les diabétiques etc. Donc là il faut être très précis : si votre avatar a 35 ans ne dites pas 60, si vous ne touchez pas les diabétiques, vous allez venir adapter en fa »)
- Un script se rédige avec des mots qui déclenchent des IMAGES MENTALES et avec le vocabulaire exact des clients ; le flou n'impacte pas. (MASTER ACQUISITION / 16 — Custom GPT pour créa [01:13] et [01:57] : « Il va venir utiliser des mots des clients, c'est-à-dire il ne va pas venir inventer des termes […] Quand vous scriptez, un mot permet de déclencher une image mentale, c'est ça qui va venir impacter et créer des émotions. »)

**Absent du corpus** : 1) AUCUNE durée chiffrée par bloc. La formation donne des durées globales (30-90 s, 20-60 s, 15-30 s, 3-10 min), la fenêtre du hook (mouvement à 0,5 s, pertinence dans les 1-5 s, mesure sur 3 s) et la durée d'un plan (2-3 s, scène de 3 s dans la checklist), mais ne dit JAMAIS « le hook dure X secondes, le problème Y secondes, le CTA Z secondes » — sauf le CTA « compris en 3 à 7 secondes ». Ne pas inventer de découpage temporel bloc par bloc.

2) La liste exacte des blocs marketing que Matteo colle dans ChatGPT en leçon 10 n'est JAMAIS énoncée à l'oral ni affichée dans la transcription (« Donc ça c'est mes blocs marketing qu'on utilise dans les VSL » — on voit l'écran, pas le texte). La liste de 23 blocs que je rapporte vient du tableau public « Analyse Bangers Ads Flytex » (RESSOURCES NOTION / 30), qui est la meilleure reconstitution disponible dans le corpus, mais ce n'est pas formellement présenté comme « la » liste de la leçon 10.

3) Les 3 frameworks winner de la leçon 11 ne sont JAMAIS lus mot à mot. Matteo commente des slides à l'écran ; la transcription ne contient que ses commentaires et des bribes de phrases (souvent déformées par Whisper : « user-benefit » pour les bénéfices secondaires, « héros au fonction » pour hero function, « la route de cause » pour root cause). Il n'existe donc AUCUN script FR complet mot à mot de ces trois frameworks dans le corpus.

4) Le Playbook Notion « Les Créatives » (la ressource officielle citée par les leçons 09, 10 et 11) n'est capturé que sous forme de SOMMAIRE. Les sections « Scripting », « Structure Winneuses », « SOP : Frameworks selon le niveau de Conscience du marché », « La Checklist, pour une ads réussie », « LE PROCESS CREATIVE ANDROMEDA (2026) » et « 290 Hook Headline » sont listées mais leur CONTENU est absent. C'est le plus gros trou du corpus pour ce domaine.

5) Le template Google Docs de script (« un template utilisé par les plus gros copywriters, les plus grosses brands », leçon 10 [01:29]) n'est pas dans le corpus : on ne sait pas quelles colonnes/sections il contient.

6) Les 9 sections exactes du framework « Official Apology Statement » et son prompt universel ne sont pas capturés — le document Notion affiche « Loading Plain Text code… » à leur place. Idem pour le « 1 framework éprouvé (PAS – Style natif) » du document « Publicités statiques natives (long ad copy) » : le framework PAS est annoncé mais son contenu n'est pas chargé.

7) La checklist « ads réussie » (simple pour le vidéo éditeur, avancée pour le creative strategist) est mentionnée à plusieurs reprises (leçon 13, mastermind) mais son contenu n'est jamais énuméré, sauf un seul point cité en exemple (« est-ce que toutes les scènes sont de 3 secondes ? »).

8) Aucune règle de longueur en NOMBRE DE MOTS, en nombre de phrases par bloc, ni de vitesse de lecture (mots/minute). Seule contrainte de rédaction proche : en tournage, ne pas donner plus de 3-4 phrases d'affilée à l'actrice, tourner phrase par phrase (0 TO 1 / 42).

9) Le prompt du custom GPT « scripter comme Matteo » (leçon 16) est décrit dans ses intentions (mots des clients, frameworks éprouvés, tensions émotionnelles, images mentales, ton masculin affirmé, jamais académique/cheap, légèrement fun quand ça a du sens) mais son texte n'est pas reproduit.

10) Rien dans le corpus ne donne un ordre de blocs pour les formats non-vidéo (carrousel, collection ads) : les seules structures écrites concernent la vidéo et le long ad copy natif.


---

## 🎬 Formats, montage, diversité

> La formation ne traite pas « le format » comme un habillage mais comme une VARIABLE de diversité que Meta récompense depuis Andromeda : (Message/angle × (Avatar × Awareness)) × Concept × Coherence Index. Elle fournit deux listes fermées exploitables telles quelles — la Diversity Map (26 styles vidéo + 12 styles statiques) et le Creative Strategy Playbook (Core/Extended formats, ratios 1:1 / 4:5 / 9:16 + Carrousel = hack) — plus des typologies serrées par famille (4 formats Arcads, 5+2 styles cartoon, 4 styles du skill AI Ads, 3 formats statiques à tester…). Le montage a une doctrine explicite et chiffrée : « méthode Marvel » (changement de plan toutes les 2-3 s), transitions simples, zéro erreur visuelle ou auditive, typographie type sous-titres à position fixe, musique mainstream reprise des ads winners, lumière soignée, b-roll qui prouve ou crée une émotion. Le batch a un ratio chiffré (Vidéo 60 % / Statique 30 % / WL 5 % / Motion 5 %, avec 4/4/3/3 variations) et une règle anti-doublon (changer 3 éléments parmi hook, visuel, texte, durée, format, message). Enfin la miniature est traitée comme un levier à part entière (sélection manuelle obligatoire, close-up, rouge, hook en miniature).

### Media Formats — liste fermée officielle du Creative Strategy Playbook (cheat sheet de diversification)
*Source : RESSOURCES NOTION / 26 — Creative Strategy Playbook - cheat Sheet (référencé par CRÉATIVE INSIGHT / 42 Ep #27 - Creative Diversification)*

- **Static Images** — Core Format. Image fixe.
  - *Ex :* Brief statique type : format 1/1 (1080×1080), 20 ads par lot.
- **Short-form Video** — Core Format. Vidéo courte.
  - *Ex :* « Short ads » 30 à 90 secondes (MASTER ACQUISITION / 12).
- **Carousels** — Core Format. Plusieurs visuels faisant défiler.
  - *Ex :* Hack : remettre deux winning ads existantes en carrousel = format neuf aux yeux de Meta.
- **Collection Ads** — Core Format listé dans la cheat sheet.
  - *Ex :* (aucun exemple donné dans le corpus)
- **Single Image with CTA** — Core Format listé dans la cheat sheet.
  - *Ex :* (aucun exemple donné dans le corpus)
- **Shop Ads** — Extended Format listé dans la cheat sheet.
  - *Ex :* (aucun exemple donné dans le corpus)
- **Product Tagging** — Extended Format listé dans la cheat sheet.
  - *Ex :* (aucun exemple donné dans le corpus)
- **Messaging Ads** — Extended Format listé dans la cheat sheet.
  - *Ex :* (aucun exemple donné dans le corpus)
- **Instant Experience** — Extended Format listé dans la cheat sheet.
  - *Ex :* (aucun exemple donné dans le corpus)

### Aspect Ratios for Impact (ratios à tester)
*Source : RESSOURCES NOTION / 26 — Creative Strategy Playbook - cheat Sheet ; confirmé par MASTER ACQUISITION / 39 [09:46] et / 40 [04:05]*

- **1:1** — Carré. Format par défaut des statiques dans le brief interne (1080×1080).
  - *Ex :* « ça vous fait une vingtaine d'hats en format 1.1 et après on y taire dans d'autres formats » (CI / 53 Ep #14 [07:59])
- **4:5** — Vertical partiel, cité dans la checklist anti-doublon comme format à tester.
  - *Ex :* « il y a le format 916 à 1, 4, 5. Donc là, idéalement, il faut tester sur différents formats » (MA / 39 [09:46])
- **9:16** — Vertical plein écran (Reels / TikTok / Stories). Format par défaut des pipelines IA cartoon et statiques animées.
  - *Ex :* Skill AI Ads Modulable & ADS Cartoon IA : « Format 9:16 » ; Seedance storyboard : « 15 secondes pour ma 916 ».
- **Carrousel (HACK)** — Marqué explicitement « HACK » dans la cheat sheet : pour Meta, mettre une créa déjà winner en carrousel équivaut à un format neuf.
  - *Ex :* « Vous pouvez reprendre deux winning hats et les remettre en carousel et ça sera nouveau pour Meta » (CI / 42 Ep #27 [05:15])
- **16:9** — Format horizontal, cité pour la génération de storyboards (pas comme format d'ad).
  - *Ex :* « On va mettre toujours en 16 9e, ça il va vraiment être un storyboard complet » (MASTER IA / 30 [03:40])

### Diversity Map — Video ads 📽️ : liste fermée des styles d'ads vidéo à couvrir
*Source : RESSOURCES GOOGLE / 22 — Diversity Map (tableur de suivi, colonne « Style of ad », onglet Video ads)*

- **Hidden Camera Reaction** — Réaction filmée en caméra cachée. Statut marqué « Winner » dans la map.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Podcast-Style Ads** — Ad tournée comme un extrait de podcast (micro, studio, deux interlocuteurs ou face-cam).
  - *Ex :* Arcads / Mirage : « on a mis un fond derrière comme Joe Rogan », « format podcast. Très très bien. Il y a pas mal de winning hats »
- **Street Interview** — Micro-trottoir : on interroge des passants sur le produit puis on enchaîne les réactions.
  - *Ex :* « qu'est-ce que vous avez pensé de ce parfum ? … vous faites une réaction de plein de personnes différentes … un effet social proof de ouf » (CI / 62 Ep #1 [02:41])
- **Founder Story** — Le fondateur raconte pourquoi il a créé la marque. Déclaré « indispensable en 2025-2026 » post-Andromeda.
  - *Ex :* « j'ai créé Evian parce que je voulais aider toutes les personnes qui ont mal au dos comme moi » (MA / 41 [02:53])
- **Founder Interview** — Le fondateur en format interview.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Hybrid Mashup** — Montage assemblant plusieurs extraits/personnes différentes. Le style le plus massivement marqué « Winner » dans la Diversity Map (winner sur presque tous les angles).
  - *Ex :* « j'aime bien pour les ads, c'est faire du mashup, c'est-à-dire prendre plusieurs personnes différentes, essayer de ne pas trop montrer de visages » (MA / 06 [12:38])
- **Before / After (Split Screen)** — Avant/après en écran divisé.
  - *Ex :* « Si c'est des skin care, il faut du avant après » (CI / 29 Ep #39 [01:59])
- **THEM vs THEM Video (Split Screen)** — Comparatif split screen entre deux solutions concurrentes.
  - *Ex :* Décliné en « US vs THEM » dans le pack d'annonces post-Andromeda (MA / 41 [03:19])
- **Viral Ads** — Ad conçue pour la viralité organique.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Hand Demonstration** — Démonstration à la main, produit tenu / manipulé face caméra.
  - *Ex :* « le fait de tenir dans la main … c'est très captivant » (CI / 59 Ep #5 [00:46])
- **High-Production Video Ads** — Ad très produite / cinématique (opposée à l'ugly ad).
  - *Ex :* « style luxurie cinématique shooting » (MASTER IA / 24 [02:35])
- **POV (Point-of-View) Reels** — Ad tournée en point de vue subjectif.
  - *Ex :* « vous pouvez tester aussi des POV … comment ma femme a perdu du poids ? … un autre point de vue » (CI / 03 Ep #61 [10:02])
- **Live Shopping Events (ugly ou pas)** — Événement de live shopping, brut ou soigné.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Mini VSL (<3min)** — Video Sales Letter courte, moins de 3 minutes.
  - *Ex :* « une short ad, c'est une mini-VSL au fond … Longue vidéo, je dirais plus de 3 minutes. Donc on fait en général entre 3 et 10 minutes » (RÉUSSIR SON Q4 / 13 [1:05:04])
- **Taste / Look Test** — On fait tester/goûter/essayer le produit en direct à un avatar. Détaillé comme « UGLY Taste / Look / Live Test ».
  - *Ex :* « Je ne pensais pas que ça aurait le goût d'un brownie » / « J'ai l'impression d'avoir perdu 5 kg juste en l'enfilant »
- **Live Testimonial (Video Call)** — Témoignage filmé en visio.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Reel Format** — Format Reel natif.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Narrative Ads** — UGC scripté qui raconte une histoire et vend à la fin sans avoir l'air de vendre.
  - *Ex :* Hook testostérone : « comment je suis passé de coucher 3 fois par mois avec ma femme à 5 fois par semaine »
- **Carousel Ads** — Ad carrousel.
  - *Ex :* Voir hack carrousel.
- **Negative Marketing Mashup** — Mashup construit sur un angle négatif.
  - *Ex :* Voisin du « listicle style négatif : pourquoi ils regrettent d'acheter ceci » (CI / 13 Ep #48 [00:52])
- **EGC (Employee Generated Content)** — Contenu produit par les employés de la marque.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Text-First / Caption Heavy** — Ad portée par le texte à l'écran plutôt que par la parole.
  - *Ex :* « un format assez court avec un texte … c'est le format TikTok love letter » (CI / 13 Ep #48 [04:25])
- **Catalog / DPA** — Publicité dynamique catalogue.
  - *Ex :* Best practice associée : « Overlays for catalog ads » (cheat sheet)
- **Creator Testimonial (1-Person UGC/IA)** — Témoignage d'un créateur seul, réel ou généré par IA.
  - *Ex :* Raw Talking Head : « une personne qui parle de manière raw, face cam, un peu de manière ugly »
- **Live Call With Customer** — Appel filmé avec un client.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Skit Ad** — Saynète à deux personnages qui se parlent et se regardent.
  - *Ex :* « un format skit où il y a deux personnes qui se parlent … très divertissant, marche aussi beaucoup sur TikTok » (CI / 62 Ep #1 [00:44])

### Diversity Map — Static ads 📷 : liste fermée des styles de statiques à couvrir
*Source : RESSOURCES GOOGLE / 22 — Diversity Map (onglet Static ads)*

- **Stupid simple** — Statique volontairement ultra simple. C'est le style statique le plus marqué « Winner » de la map.
  - *Ex :* « c'est juste une image de quelqu'un qui a un gros ventre … on entoure le gros ventre … des images grossières, images toutes simples, un peu qui choquent » (CI / 40 Ep #25 [04:16])
- **Clear & creative** — Statique claire et créative.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Blank background product shot** — Produit sur fond neutre/uni.
  - *Ex :* « le produit sur ce fond bleu … ça capture naturellement l'attention » (MA / 36 [08:54])
- **Product action shot** — Produit en situation d'usage.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **UGC style with quote** — Visuel UGC surmonté d'une citation client.
  - *Ex :* Décliné en « TRUSTPILOT REVIEW · STATIC » dans la semaine type (5 ads, 30 min)
- **Vs. (comparison to competitors)** — Comparatif frontal avec un concurrent nommé.
  - *Ex :* « on est plus cher. Et c'est pour une bonne raison. Voilà, il liste les raisons » (CI / 40 Ep #25 [00:24])
- **Vs. (generic solutions)** — Comparatif contre les solutions génériques du marché. Statut « Winner » sur l'axe Identity.
  - *Ex :* Comparatif Longévité : « pharmacy/generic version … 3-6 WEEKS » vs « premium version … 12-18 MONTHS »
- **Gift idea** — Statique orientée cadeau.
  - *Ex :* (pas d'exemple détaillé dans le corpus)
- **Before & after** — Avant/après statique.
  - *Ex :* « un avant après avec une longue ad copy c'est juste tueur » (CI / 32 Ep #34 [07:16])
- **Bizarre** — Visuel étrange / WTF destiné à casser le scroll.
  - *Ex :* « Ça peut être what the fuck, être étrange. Mais idéalement dans la niche » (CI / 32 Ep #34 [07:37])
- **Trendy / meme** — Statique meme ou tendance.
  - *Ex :* Voisin du lot « BATCH NAME · STATIC FUNNY · PROD » (4 ads, 30 min) de la semaine type
- **Native with long form ad copy + music** — Image native basique + très longue ad copy dans le post. Statut « Winner ».
  - *Ex :* « des ads comme ceci où il y a juste une photo basique et c'est l'ad copy qui fait toute la vente … des gens qui sont passés de 10K/j à 60K/j juste avec ça »

### Creative Approach (niveau de production) — liste fermée
*Source : RESSOURCES NOTION / 26 — Creative Strategy Playbook - cheat Sheet*

- **Lo-Fi › Creator-led Content** — Contenu porté par un créateur.
  - *Ex :* Creator Partnership / gifting à 1000 micro-influenceurs (MA / 41 [06:39])
- **Lo-Fi › Reels/TikTok-style Language** — Codes de langage et de montage natifs Reels/TikTok.
  - *Ex :* « Montage simple, type TikTok » (CI / 59 Ep #5 [02:10])
- **Lo-Fi › User-generated Content** — UGC brut.
  - *Ex :* « Ugly ads : tourné avec un iPhone, il n'y a pas de montage, ça ne fait pas pub »
- **Hi-Fi › Product-focused Storytelling** — Storytelling produit soigné.
  - *Ex :* (pas d'exemple détaillé)
- **Hi-Fi › Lifestyle-driven Visuals** — Visuels lifestyle léchés.
  - *Ex :* (pas d'exemple détaillé)
- **Hi-Fi › Motion Graphics & Animation** — Motion design et animation. Correspond à la ligne budgétaire « Motion » (5 % du batch).
  - *Ex :* Statique animée via Kling AI / skill Claude
- **Other › Fully Animated Stories** — Histoire entièrement animée.
  - *Ex :* Ads cartoon (Pixar, Clay, 2D, Medical 3D)

### Placements (où la créa est diffusée) — liste fermée
*Source : RESSOURCES NOTION / 26 — Creative Strategy Playbook - cheat Sheet*

- **FB & IG › Feed** — Fil d'actualité Facebook/Instagram.
  - *Ex :* —
- **FB & IG › Stories** — Stories.
  - *Ex :* —
- **FB & IG › Reels** — Reels.
  - *Ex :* —
- **FB & IG › Search** — Placement recherche.
  - *Ex :* —
- **FB & IG › In-stream Video** — Vidéo in-stream.
  - *Ex :* —
- **Audience Network › Native Ads** — Ads natives hors plateforme.
  - *Ex :* —
- **Audience Network › Banner Ads** — Bannières.
  - *Ex :* —
- **Audience Network › Rewarded Ads** — Ads récompensées.
  - *Ex :* —

### Les 4 formats UGC IA validés sur Arcads (avec awareness et durée cible)
*Source : CRÉATIVE INSIGHT / 62 — Ep #1 Arcads IA et formats qui convertissent (= MASTER IA / 26)*

- **Skit (2 personnages)** — Deux acteurs, un homme et une femme, qui se parlent et se regardent. On reprend son meilleur script et on le passe en forme de discussion. Cible : solution/product aware. Durée : 30 s à 1 min 30 max. Très divertissant, marche fort sur TikTok.
  - *Ex :* « reprends mon meilleur script et simplement fais-le pour un format skit où il y a deux personnes qui se parlent »
- **Street Interview** — Micro-trottoir : on fait réagir plusieurs personnes différentes au produit, ce qui crée un effet social proof. À utiliser sur des réactions physiologiques (attirance, beauté). Inconvénient : on ne voit pas le produit → il faut monter des footages produit derrière.
  - *Ex :* « Qu'est-ce que vous avez pensé de ce parfum ? … elle dit amazing j'adore l'odeur … elle dit j'aimerais que mon mari sente ça »
- **Podcast** — Format podcast, avec micro. « Il y a pas mal de winning ads qui tournent sur beaucoup de winning ads. » On adapte le script pour que ce soit naturel en podcast — on ne parle pas de la marque comme une pub.
  - *Ex :* Mirage : avatar « Ron » créé sur mesure, fond inspiré du plateau Joe Rogan pour que ce soit déjà familier au spectateur.
- **Docteur** — Un docteur parle. « Ça marche bien pour tout ce qui est santé. » Peut n'apparaître qu'une seconde en début de vidéo — cela suffit à changer totalement la vidéo.
  - *Ex :* « Rien que le fait de voir le docteur en début de la vidéo, juste une seconde qui dit une phrase, et après tout le reste, ça va changer totalement la vidéo. »

### Les styles d'ads cartoon qui performent (5 établis + 2 émergents + 3 pistes)
*Source : MASTER IA / 34 — Ep #58 Styles d'ads cartoons qui performent (= CRÉATIVE INSIGHT / 06)*

- **Claymotion (pâte à modeler)** — Style pâte à modeler, « comme pour les enfants ». Permet d'animer des éléments même médicaux de façon ciblée sans se faire reprendre par l'algorithme Meta.
  - *Ex :* Style crochet en claymotion pour un hook impossible à tourner en réel.
- **Musical** — Ads cartoon de type musical, y compris des musiques style Disney. « Ça cartonne. »
  - *Ex :* Cosmétique : « comme si elles étaient dans un magasin, elles trouvent une crème »
- **2D** — Dessin animé 2D, avec une VO prenante et grave.
  - *Ex :* « C'est vraiment comme des dessins animés, c'est une VO assez prenante, avec une voix grave. »
- **Pixar (3D anthropomorphe)** — Le style le plus connu et le plus utilisé : chaque élément du script est incarné par un personnage.
  - *Ex :* « quand il parle d'un élément, il va représenter ça avec un personnage »
- **3D** — Éléments 3D réutilisables à l'intérieur d'un mashup (un monde UGC + un monde 3D).
  - *Ex :* « c'est un élément 3D que vous pourrez réellement mettre dans une ad dans un format mashup »
- **Style crochet (émergent)** — Nouveau format, en claymotion/crochet, avec ajout d'effets sonores. Permet des hooks impossibles à filmer en réel.
  - *Ex :* « ce style de hook, vous n'auriez pas pu le faire dans un format réel »
- **Style « Zach des films » (émergent)** — Frames enchaînées SANS coupe : on met le début de la frame 1 avec la fin de la frame 2, puis on reprend la frame 2 en frame 1 avec la frame 3 — ce qui donne une continuité parfaite au montage. « Le plus puissant » des nouveaux.
  - *Ex :* « c'est une scène sans cut … donc avec Kling : début de la frame 1, frame 2 en input, puis frame 2 en frame 1 et frame 3 »
- **Playmobil (piste)** — Format Playmobil, déjà testé par de grandes marques, souvent avec de l'ASMR.
  - *Ex :* « format Playmobil qui tourne chez eux … avec du chuchotement »
- **Lego (piste)** — Format Lego, encore peu vu, jugé très scalable si le persona collectionne.
  - *Ex :* « Si vous voyez que votre persona cible aime les Lego, faire quelque chose en Lego »
- **GTA (piste)** — Style GTA pour un persona 20-35 ans.
  - *Ex :* « si vous avez un persona cible qui a entre 20 et 30-35 ans, ça pourrait être intéressant de faire un format GTA »

### Skill AI Ads Modulable — 4 styles visuels × 3 modes d'exécution (12 workflows)
*Source : RESSOURCES NOTION / 03 — Skill AI Ads Modulable (= MASTER IA / 31 Ep #51 ; CRÉATIVE INSIGHT / 16)*

- **Style A — Cartoon 3D Pixar** — Personnage anthropomorphe glossy, visage Disney embedded, no arms/legs. Cas d'usage : aliments, organes, ingrédients star, objets fonctionnels. Musique de post-prod : énergique / éducative.
  - *Ex :* Marques recommandées : supplément/santé (anthropomorphiser l'ingrédient star), food/cuisine.
- **Style B — Clay Stop-Motion** — Pâte à modeler tactile, style Aardman / Wallace & Gromit, décor miniature. Cas d'usage : storytelling humain, personnages animaliers, charme artisanal. Musique : folk / acoustique légère.
  - *Ex :* « J'ai remplacé mon café par Mushilo … Trois semaines après, je redeviens la maman que je veux être. »
- **Style C — 2D Animation** — Dessin animé moderne, line art, cel-shading, anime-inspired. Cas d'usage : audiences jeunes, émotions fortes, contenu éducatif fun, tech/SaaS/B2B. Musique : électro / dynamique.
  - *Ex :* « 50 mg de caféine plus 6 champignons adaptogènes. Le focus sans le jitter… »
- **Style D — Medical 3D** — Visualisation anatomique photoréaliste, type BBC Earth / « Inside Your Body ». Cas d'usage : compléments santé, fitness, douleurs physiques, mécanismes bio. Musique : nappes orchestrales / cinématiques.
  - *Ex :* « Je suis ton estomac. Et chaque matin à 6 heures, tu me fais brûler de l'intérieur. Acide chlorhydrique. Cortisol. Inflammation chronique. »
- **Mode 1 — Full autonome** — Claude lit les Doc/, décide tout (personnage, angle, hook, dialogues) et génère sans validation. ~10 min. Pour la production en masse.
  - *Ex :* On tape « Go » et rien d'autre.
- **Mode 2 — Semi-autonome** — Génère 5 scripts diversifiés (5 angles différents, 5 hooks différents du TOP 10, 5 verbatims différents) dans scripts_proposals.md ; on choisit. ~12 min. « Zone ROI maximum. »
  - *Ex :* « Tu vois 5 angles d'un coup, tu en produis 2-3 qui te plaisent, tu testes en A/B sans effort. »
- **Mode 3 — Script importé** — On fournit son script ; Claude le mappe en 4 scènes (Hook → Problème → Solution → CTA) sans réécrire les mots, seulement en les adaptant techniquement. ~10 min.
  - *Ex :* Pour une VSL existante à reskinner.

### 3 nouveaux formats de statique à tester, avec leur stade d'awareness et leurs specs de mise en page
*Source : CRÉATIVE INSIGHT / 03 — Ep #61 3 New format static à tester + RESSOURCES NOTION / 47*

- **Format 1 — Le Comparatif « Longévité »** — Grille 2×2 comparant le produit générique dégradé vs le produit premium intact, avec ancrage temporel exact. Awareness : Solution-Aware / Product-Aware. LP idéale : listicle « [X] boxers compared ». Specs : 2 states minimum / 4 states maximum (au-delà = cognitive overload), fond neutre beige ou blanc, flèches directionnelles, headline 5-7 mots max + subhead 8-12 mots, ratio conseillé 4:5.
  - *Ex :* Prompt fourni : « Ecommerce product comparison chart, 4 photos of [PRODUCT] arranged in 2×2 grid on soft beige background… labels ('3-6 WEEKS', 'PHARMACY ELASTIC', '12-18 MONTHS', 'PREMIUM KNIT-IN')… --ar 4:5 --v 6 »
- **Format 2 — Le Journal Illustré (Sticker Progress Scrapbook)** — Illustrations hand-drawn/aquarelle en stickers sur un fond réel photographié (liège, cahier, journal), 3 stages max (Month 1 / 2 / 3), police manuscrite (Kalam, Caveat, Homemade Apple, Amatic SC), produit placé DANS UN COIN jamais au centre. Awareness : Unaware → Problem-Aware. LP idéale : advertorial storytelling long. Micro-transformations visibles panel à panel, jamais de cure miracle.
  - *Ex :* Prompt fourni : « Watercolor sticker illustration on cork board background… 3 stages labeled 'Month 1', 'Month 2', 'Month 3'… Small product sticker in bottom-right corner… --ar 4:5 --v 6 »
- **Format 3 — Le Tableau Noir Pédagogique** — Craie blanche sur tableau vert/noir à cadre bois. 4-5 bullets max, illustration anatomique médicalement plausible (pas de caricature), stats crédibles, CTA implicite obligatoire en fin (« HERE'S HOW → »), polices Chalk Line / Chalkduster / Marker Felt / Just Another Hand, ratio 1:1. Awareness : Unaware → Problem-Aware. Parfait pour funnel advertorial et golden nugget insight.
  - *Ex :* Prompt fourni : « Chalkboard illustration style, hand-drawn white chalk on dark green/black board with wooden frame… bullet list in chalk handwriting… Arrow drawn pointing right with 'HERE'S HOW →' in a hand-drawn box. --ar 1:1 --v 6 »

### 3 concepts de statiques testés et validés (analyse de statiques)
*Source : CRÉATIVE INSIGHT / 43 — Ep #19 Analyse de statiques*

- **« Une vie sans [problème] »** — Image produit + headline décrivant la vie du client SANS son problème, le produit étant explicitement la solution. On décline plein de variations de messages, avec ou sans logo.
  - *Ex :* « Une vie sans ballonnement » (probiotiques), « Une vie sans bouton » (cosmétique)
- **Le fait marquant / chiffré** — On donne un fait chiffré qui montre à quel point le problème que résout le produit est important, pour cibler ceux qui connaissent le produit mais n'ont pas encore conscience de son importance. Mise en page : produit au centre, offre ou proposition de valeur extra, logo optionnel, headline puissante avec des chiffres.
  - *Ex :* « Vous passez peut-être 18 heures par jour dans votre t-shirt. Faites le bon choix. » / Loop : le temps passé à dormir.
- **Le listicle de conseils (TikTok)** — « Comment être [moins X] » suivi de conseils, le produit arrivant en dernier de la liste. Fonctionne en statique ET en vidéo légère. Longueur : entre 5 et 7 items (pas plus, sinon pas le temps de lire). En vidéo : chaque item dure 3-4 secondes, avec musique tendance TikTok.
  - *Ex :* « Comment être moins ballonné … et à la fin : utiliser tous les jours le [produit] »

### 4 styles/concepts d'ads winner (UGC & animation)
*Source : CRÉATIVE INSIGHT / 13 — Ep #48 Différents Style & Concepts d'Ads Winner*

- **Listicle style négatif** — « Pourquoi ils regrettent d'acheter ceci ». Cible les gens brand-aware (stage 6) ET product-aware qui n'ont pas acheté. L'angle négatif leur donne raison, et on en convertit une partie. Montage : change de plan toutes les deux secondes, ton un peu drôle, très UGC, durée < 30 secondes.
  - *Ex :* « c'est très bien scripté, très bien monté … ça change de set toutes les deux secondes … ici une ad de moins de 30 secondes »
- **UGC texte + sons** — Ad jouée sur les musiques, les sons et le texte à l'écran. « N'importe qui peut le tourner n'importe où. » Ajouter une image dessinée fonctionne très bien.
  - *Ex :* « bien joué avec les musiques, avec les sons, avec les textes … j'ajoute une image qui est dessinée, ça aussi c'est top »
- **TikTok Love Letter** — Format court, texte à l'écran que les gens lisent + musique, écrit comme si on racontait une histoire. Marche sur TikTok ET Meta. Variantes : version plus longue déroulée comme un carrousel, ou image fixe à la place d'une vidéo. « En général, il vous donne de très bons CPM. »
  - *Ex :* « si vous faites des natives longues à deux copies, vous pouvez mettre le format en plus court »
- **Animation / POV du problème** — Ce n'est pas seulement le format animation qui marche, c'est le point de vue : ce n'est pas quelqu'un qui parle, c'est LE PROBLÈME qui parle. Le cerveau du prospect baisse ses armes parce qu'un dessin animé est récréatif. Montage : change de scène toutes les 2-3 secondes.
  - *Ex :* « ça change de scène toutes les deux, trois secondes … là on entre les méchants, on mécanise très bien »

### Pack d'annonces post-Andromeda : les 7 types de contenu à avoir dans la creative library
*Source : MASTER ACQUISITION / 41 — Scaler post-Andromeda (3/4)*

- **UGC / témoignage / story de créateur** — Beaucoup de témoignages authentiques, très ugly, SANS montage.
  - *Ex :* « beaucoup de vidéos très authentiques, très ugly, sans montage »
- **Founder / brand story** — « Indispensable en 2025-2026 » : crée la connexion émotionnelle et le why quand Meta noie le prospect sous toutes les solutions concurrentes.
  - *Ex :* « j'ai créé Evian parce que je voulais aider toutes les personnes qui ont mal au dos »
- **Face cam / ugly ads** — Face cam de clients. « Plus les ads vont être authentiques, ugly, vont ressembler à ce que les gens voient dans leur fil, mieux ça va marcher. »
  - *Ex :* « moi j'ai acheté cette bouteille d'eau parce que je voulais quelque chose qui m'empêche d'avoir mal au dos »
- **US vs THEM (discrédit des concurrents)** — Marqué « en rouge » comme prioritaire post-Andromeda. Idéalement PAS à la première personne (« j'ai testé et je conseillerais la marque X », pas « choisissez mon produit »).
  - *Ex :* « vous hésitez entre la San Pellegrino ou l'Evian, je vais vous expliquer laquelle est mieux pour moi qui souffre de problèmes de dos »
- **Before / after + social proof** — Montrer les résultats et prouver que ça marche aussi pour les autres.
  - *Ex :* —
- **Offres / promotions** — Images très simples avec l'offre, les stocks bas, la deadline. Pour les gens tout en bas du funnel.
  - *Ex :* « votre bouteille Evian, moins 50% aujourd'hui, ça se termine aujourd'hui » ; « vous montrez juste le prix barré et le prix d'aujourd'hui et les gens vont acheter » (CI / 34 Ep #28)
- **Objections** — Vidéos qui répondent aux plus grosses objections du produit.
  - *Ex :* « oui mais le verre, c'est lourd à transporter »

### Raw Talking Heads & Statiques animés : 2 formats × 3 moteurs, et le format par étage de trafic
*Source : RESSOURCES NOTION / 05 — Raw Talking Heads & Statiques Animés (= CRÉATIVE INSIGHT / 04 Ep #62 ; MASTER IA / 36)*

- **Format A — Raw Talking Head** — Face cam, brut, presque « ugly », zéro production léchée. Un SEUL créateur couvre tout le funnel. Trafic froid → version courte (susciter la curiosité) ; trafic tiède → version projection (répondre au scepticisme, aider à se projeter en train d'utiliser le produit) ; trafic chaud → version Q&R (répondre directement aux questions, face cam, sans mise en scène).
  - *Ex :* « You know that girl on TikTok who does the… » — pipeline : image UGC + VO → prompt Claude avec @image1 / @audio1 → Seedance 2.5 lip sync.
- **Format B — Statique animé** — Une statique existante mise en mouvement. « Des marques scalent aujourd'hui avec ça, qui vont énormément dans leur creative library. » Le format le moins cher à produire en volume puisqu'on repart d'assets déjà payés. Convient à tous les étages de trafic.
  - *Ex :* On reprend la statique, on la passe au skill Claude ou directement à Kling AI ; quelques minutes.
- **Moteur — Seedance 2.5** — Jusqu'à 30 s ; jusqu'à 30 images, 10 vidéos et 10 audios en référence ; lip sync. Pour talking head UGC, créa très cadrée, vidéo longue. 0,19 €/seconde sur Kie.AI avec image ou vidéo en input (~5-6 € pour 30 s) contre 0,30 à 0,50 €/s ailleurs.
  - *Ex :* À éviter : le text-to-video pur, ~0,11 €/s de plus et rendu moins propre — toujours au minimum une image en input.
- **Moteur — Minimax H3** — Jusqu'à 15 s, image-to-video et référence-to-video, moins cher que Seedance. Pour du volume à petit budget.
  - *Ex :* Animer une personne qui chante : image + vidéo d'exemple + audio de la musique + durée + résolution.
- **Moteur — Kling AI** — Animation d'une statique existante. « Le plus rapide sur le format statique animé. »
  - *Ex :* —

### Les 7 éléments visuels obligatoires d'un prompt vidéo (brief de réalisateur)
*Source : MASTER IA / 24 — Sora 2 : créer un prompt puissant et réaliste*

- **1. Angle et mouvement de caméra** — UN SEUL mouvement clair (travelling avant, pan) — ou pas de mouvement du tout si l'on veut un plan fixe (ex. format podcast).
  - *Ex :* « un seul mouvement clair, si travelling avant, lent, ou alors pas du tout de mouvement »
- **2. Type de plan et profondeur de champ** — Plan large, gros plan, vue à la première personne ; préciser la mise au point (flou ou net).
  - *Ex :* —
- **3. Lumière et palette de couleurs** — Toutes les couleurs de la scène, cohérentes avec le produit et le moment.
  - *Ex :* « pour les gummies pour dormir, une ambiance chaude, cosy, parce que c'est dans une chambre avant d'aller dormir »
- **4. Persona** — Âge, apparence, émotion, posture — pour garder la cohérence entre les plans. À décrire de façon très poussée (mesures entre traits du visage, forme et couleur des yeux, structure).
  - *Ex :* Hack : envoyer l'image d'un personnage d'une ad concurrente à ChatGPT et demander « analyse le personnage de cette image et crée une description du personnage réutilisable ».
- **5. Décor et contexte** — Une ambiance identifiable : matériau, texture, objet.
  - *Ex :* « un mur texturé, lumière chaude »
- **6. Son et ambiance audio** — Bruitages en plus du dialogue ; préciser si l'on veut ou non une VO, et quels bruitages précis. Préciser le micro utilisé améliore la qualité de voix.
  - *Ex :* « un clic de souris, le bruit d'un bic, le bruit des gens qui traversent dans la rue » ; « dire quel micro il utilise pour parler, c'est ça qui va améliorer la qualité de la voix finale »
- **7. Style visuel et émotions** — Le rendu et le ton, déclaré dès le début du prompt car il influence tout (caméra, lumière, couleur, rythme). 3 à 5 détails distinctifs mais cohérents.
  - *Ex :* « un style de documentaire des années 90, un style de format UGC smartphone, un style de luxury cinematic shooting »

### Les types de b-rolls à faire générer scène par scène
*Source : MASTER IA / 14 et 15 — Méthode Manus / ChatGPT création de b-roll ; MASTER IA / 24 Sora 2*

- **CGI / imagerie médicale** — Mannequin translucide, vue anatomique, ce qui se passe dans le corps. Utilisé pour mécaniser et pour les hooks percutants.
  - *Ex :* « une scène où on voit en imagerie médicale quelqu'un qui est aux toilettes … avec des explosions de lumière rouge et orange »
- **UGC** — Personne qui prend le produit en main, le montre, verse la poudre dans sa tasse, avec le produit visible. Rendu volontairement « un peu ugly ads », pas studio.
  - *Ex :* « ça fait hyper réel, ça fait un peu ugly ads et c'est ça qu'on veut, pas qu'il y ait des trucs hyper beaux, images studio »
- **Macro** — Plan macro sur l'ingrédient / la matière.
  - *Ex :* Une frame par type de champignon (3 champignons = 3 images)
- **Séquence 3D** — Séquence 3D d'un mécanisme ou d'un objet.
  - *Ex :* —
- **Témoignage** — B-roll de type témoignage.
  - *Ex :* —
- **Métaphore temporelle** — Scène qui matérialise le passage du temps (jour 1, jour 2…).
  - *Ex :* « une métaphore de temps. C'est le premier jour »
- **Shooting produit / lifestyle / démo unboxing** — Trois catégories citées pour Sora 2.
  - *Ex :* « obtenir des UGC de très bonne qualité, des shootings produits, des scènes lifestyle et des demos style unboxing »

### Décors validés pour les Narrative Ads
*Source : RESSOURCES NOTION / 21 — Narrative Ads (= CRÉATIVE INSIGHT / 35 Ep #29)*

- **Assis sur un banc** — Parc, trottoir, endroit calme. Le décor de référence du format.
  - *Ex :* « il y avait un exemple qui marchait bien, c'était juste une personne sur un banc »
- **À la maison** — Chambre, salon, en train de s'habiller.
  - *Ex :* « Acteur IA dans une chambre »
- **Salle de bain** — Miroir, préparation, après la douche.
  - *Ex :* —
- **Devant une fenêtre** — Lumière naturelle, fond neutre.
  - *Ex :* —
- **Bureau à domicile / setup simple** — —
  - *Ex :* —
- **Dans une voiture à l'arrêt** — Uniquement si calme et lumière naturelle.
  - *Ex :* « Acteur IA dans une voiture »

### Composition du batch hebdomadaire : répartition par type et nombre de variations
*Source : RESSOURCES GOOGLE / 30 — 07 Créatives calculateur (tableur, colonnes Type Inputs & Variations Inputs)*

- **Video — 60 %** — 60 % du budget créa. Sur l'exemple chiffré (150 000 € de testing) : 138 concepts vidéo à produire, 4 variations chacun → 552 vidéos.
  - *Ex :* Budget par concept : 391 € (run 3 jours), 23 000 impressions par concept, 130 €/jour.
- **Static — 30 %** — 30 % du budget. 69 concepts statiques, 4 variations chacun → 276 statiques.
  - *Ex :* —
- **WL / Partnership ads — 5 %** — 5 % du budget. 12 concepts, 3 variations chacun → 35 WL.
  - *Ex :* Whitelisting / partenariat créateur.
- **Motion — 5 %** — 5 % du budget. 12 concepts, 3 variations chacun → 35 motion.
  - *Ex :* —
- **New Creative Tests 60 % / Iterations 40 %** — Allocation du budget de testing entre nouveaux tests et itérations, dans le calculateur.
  - *Ex :* À rapprocher de la règle contraire donnée en vidéo : « 30 à 40 % de net new concept et 60 à 70 % de vraie itération » (MA / 42 [03:45]) — le corpus donne DEUX chiffrages différents.

### Semaine type de production statique (Notion « Weekly Type ») — volumes et temps d'édition réels
*Source : RESSOURCES NOTION / 50 — [Creative Insight] Les Statics Secret Sauce (= CRÉATIVE INSIGHT / 53 Ep #14)*

- **TRUSTPILOT REVIEW · VIDEO · PROD** — Net New — 5 ads — 30 min
  - *Ex :* On reprend les avis Trustpilot et on les met en ad.
- **COPY MIMING NEW WINNING ADS** — Net New — HIGH IMPACT — lots de 12, 12, 16, 12 ads — 30 min à 1 h 30 par lot. C'est la masse du volume.
  - *Ex :* « copier les winning ads de compétiteurs directs et indirects … vous testez ça une fois sur trois, vous avez des winners »
- **MESSAGING TESTING PHASE 1 · STC** — Net New — HIGH IMPACT — 20 ads — 1 h 30
  - *Ex :* 5 messagings × 4 visuels.
- **AD LEVEL 1 BATCH NAME · STC** — ITERATION — 50 ads — 2 h 00
  - *Ex :* —
- **BATCH NAME · STATICS · PRODUCT** — Net New — HIGH IMPACT — 24 ads — 30 min
  - *Ex :* —
- **BATCH NAME · NEW CONCEPT · STAT** — Net New — HIGH IMPACT — 16 + 16 ads — 30 min chacun
  - *Ex :* « montrer le produit en dessin, montrer le produit en fruit »
- **TRUSTPILOT REVIEW · STATIC · PROD** — Net New — HIGH IMPACT — 5 ads — 30 min
  - *Ex :* —
- **BATCH NAME · STATIC FUNNY · PROD** — Net New — HIGH IMPACT — 4 ads — 30 min
  - *Ex :* —
- **TOTAL** — 192 ads · ~9 h 30 de production par semaine. « Si on a quelqu'un qui fait que des statiques et qui travaille 40 heures par semaine, techniquement avec ce process on peut produire 4-5 fois plus. »
  - *Ex :* Brief statique type : Take Winning Design + Use Canva Template To Edit Faster → Output goal : Format 1/1 (1080×1080), Total ads : 20.

### Volume de batchs par palier de CA (un batch = 4 variations minimum)
*Source : MASTER ACQUISITION / 01 — Ce que les formateurs ne vous disent pas [02:49]-[03:33]*

- **0 – 200 000 €** — 5 à 10 batchs par semaine minimum.
  - *Ex :* « il va falloir tester en 5 et 10 batchs par semaine, jusqu'à trouver ce qui marche, ensuite itérer sur ce qui marche »
- **200 000 – 500 000 €** — 10 à 15 batchs par semaine, soit ~40 ads/semaine minimum.
  - *Ex :* « quand je dis batch, c'est batch de 4 variations minimum. C'est-à-dire là on est sur 40 ads semaine minimum. »
- **500 000 €+** — 15 à 30 batchs par semaine.
  - *Ex :* —
- **1 M€+** — 30 batchs et plus par semaine.
  - *Ex :* « si vous testez plus de 30 batchs, il n'y a aucun winner, ça sert à rien de tester 500 » → problème de qualité, d'offre ou de site.
- **Composition d'un batch** — 4 ads par batch est la norme, mais un batch peut être 1 vidéo × 8 hooks différents = 8 ads.
  - *Ex :* « un batch de vidéo avec 8 hooks différents, donc ça peut être même 8 ads »

### Styles d'images performants pour les statiques natives (long ad copy)
*Source : RESSOURCES NOTION / 19 — Publicités statiques natives (Long Ad Copy) (= CRÉATIVE INSIGHT / 32 Ep #34)*

- **Avant/après subtil** — Transformation discrète, pas exagérée.
  - *Ex :* « un avant après avec une longue ad copy, c'est juste tueur »
- **Situations du quotidien réelles** — Scène de vie ordinaire, non mise en scène.
  - *Ex :* « une photo lifestyle très ordinaire → copy profond révélant la vraie raison derrière le problème »
- **Une seule personne, moment émotionnel calme** — Un seul sujet, expression fatiguée / émotion contenue.
  - *Ex :* « personne seule à une table, expression fatiguée → long texte expliquant un changement interne soudain »
- **Visuels bruts / non filtrés / style screenshot** — Image native > créa publicitaire trop polie.
  - *Ex :* « de prier avec l'iPhone » (rendu photo iPhone)
- **WTF / image étrange** — Image bizarre qui stoppe le scroll, idéalement dans la niche.
  - *Ex :* « Ça peut être what the fuck, être étrange. Mais idéalement dans la niche, c'est mieux. »
- **Volume de test recommandé** — 3 à 5 images testées, avec à chaque fois 2 longues ad copies (une sur framework prouvé PAS, une amélioration). Version cloning IA : 4-6 images + 2 ad copy (hooks différents) + 2 headlines.
  - *Ex :* Sources d'inspiration obligatoires : Ad Plexity (winners native ads), Reddit, statiques Facebook gagnants réinterprétés.

### Outils cités dans le corpus, par fonction
*Source : MASTER IA (01-38), CRÉATIVE INSIGHT, MASTER ACQUISITION / 12-13, RESSOURCES NOTION*

- **Montage & édition** — CapCut (montage, sous-titres auto style karaoké, effet reverse, Dreamina), Canva (statiques, templates), Frame.io (contrôle qualité et corrections), Magnific (upscale d'images), Asana + Slack (pilotage du monteur).
  - *Ex :* « le vidéo éditeur upload sur frame.io … et il faut lui dire de corriger son ad sous 24 heures »
- **Plateformes agrégatrices de modèles IA** — Kie.AI (le moins cher, fonctionne en crédits : 5 $ = 1000 crédits, pas d'abonnement) ; Higgsfield (« X-Field » dans les transcriptions — abonnement Ultimate ou Creator Plan, Nano Banana en illimité, upscale, face swap, lip sync, marketing studio) ; Manus (agent autonome, mode wide research, 1.6 max).
  - *Ex :* « sur Kie.AI il est beaucoup moins cher … 0,19 centimes par seconde »
- **Génération vidéo** — Kling (1.6 / 2.1 / 2.5 / 3.0 — « le meilleur pour faire des b-rolls »), Veo 3 / Veo 3.1 Fast, Sora 2 et Sora 2 Pro Storyboard, Seedance 2.0 / 2.5, Minimax H3, OmniHuman 1.5 (lip sync), Kling Speak / Kling Lip Sync 2 Pro, Leonardo AI, Pika Art.
  - *Ex :* « vraiment le meilleur pour pouvoir faire des b-rolls comme on le fait actuellement, c'est Kling 3.0 »
- **Génération d'images** — Nano Banana / Nano Banana Pro / Nano Banana 2 (meilleure cohérence des personnages et respect du texte), GPT-Image 2, Midjourney, Seedream 5.0 Lite, Google AI Studio.
  - *Ex :* Toujours générer 2 images par prompt pour avoir deux essais ; qualité 4K.
- **Avatars & UGC IA** — Arcads (~100 $/mois, ~10 vidéos), Mirage App / captions.ai/mirage (199 $/mois, correction frame par frame, meilleur que Arcads pour le français), HeyGen (leçon non transcrite).
  - *Ex :* « pour le français, c'est mieux que Arcads »
- **Voix & musique** — ElevenLabs v2/v3 (balises d'émotion, multi-locuteurs, 70+ langues, instant voice cloning recommandé ; prompts de plus de 250 caractères), Suno AI (musique chantée / « VSL en musique »).
  - *Ex :* « dupliquer une VO existante de quelqu'un qui parle sur YouTube, en instant voice cloning »
- **Sourcing d'ads & de formats** — Foreplay (creative tests, top hooks, winners identifiés), Spider, GetHook, TrendTrack (filtre par longueur de description : 1000-2000 mots, statut actif, CPM), BrandSearch, Meta Ads Library, AdHeart, AdPlexity, Pinterest (mine d'UGC hyper réalistes), Reddit, Amazon reviews, Trustpilot, TikTok (scroll manuel + automation de scraping).
  - *Ex :* « sur Foreplay … top hooks … If a man wears this he is definitely getting the look tonight »
- **Orchestration & automatisation** — Claude / Claude Code (skills : ads cartoon, AI ads modulable, storyboard creator, native ads copy, animation de statiques, musique Suno), ChatGPT + GPT customs (Prompt Machine pour Nano Banana, Video Prompt Engineer, Narrative Ads Master), n8n + Apify (scraping de statiques concurrentes vers Google Drive), ffmpeg (assemblage final).
  - *Ex :* Pipeline cartoon : ~2-4 €/vidéo, ~10 min, Kie.AI (Veo 3.1 Fast + Nano Banana Pro), format 9:16.

### Règles sourcées
- Rythme de coupe : changer de plan toutes les 2-3 secondes sur toute la durée de l'ad (« méthode Marvel »). Aucun plan fixe ne dure 5 secondes. (MASTER ACQUISITION / 06 — Créer un condor (Partie 1) [11:32] : « Ce qu'on veut, c'est qu'il n'ait pas besoin de réfléchir et que tout du long, ça change de plan toutes les 2-3 secondes. Il peut regarder dans les films Marvel, Avengers, etc. C'est ultra bien fait pour qu'on se sente bi »)
- Transitions simples et rapides — surtout pas de « gros montage » ni d'effets extravagants. Le rythme fait le travail, pas les effets. (MASTER ACQUISITION / 07 — Créer un condor (Partie 2) [04:19] : « Les transitions doivent être simples et rapides. Ça ne sert à rien de faire du gros montage. Moi, l'ad dont je parlais avant, c'est moi qui avais fait le montage sur CapCut. C'est-à-dire, les transitions, c'était simple. »)
- Zéro erreur visuelle ou auditive tolérée : pas de raccord de transition raté, jamais deux textes à l'écran en même temps. Une seule erreur bloque le scaling. (MASTER ACQUISITION / 06 — Créer un condor (Partie 1) [14:31]-[14:52] : « Il doit y avoir zéro erreur visuelle ou auditive, c'est-à-dire dans votre ad des fautes de transition, c'est qu'on voit pendant une seconde qu'il ne se finit pas, c'est mort. […] Ou vous mettez deux textes en même temps. »)
- Contrôle qualité : le monteur uploade sur Frame.io, le creative strategist relit avec une checklist (simple pour le monteur, avancée pour le relecteur) et la correction doit être faite dans les 24 heures. Un critère explicite : la durée de chaque scène doit correspondre à ce qui était prévu. (MASTER ACQUISITION / 13 — Production (Partie 2) [07:08] et [08:33] : « Ce que je conseille, c'est que le vidéo éditeur upload sur frame.io […] Il faut lui dire de corriger son ad sous les 24 heures. […] Donc par exemple un truc tout bête : est-ce que toutes les scènes sont de 3 secondes ? A »)
- Texte à l'écran : typographie normale, proche de celle des sous-titres, et POSITION FIXE d'un bout à l'autre de l'ad. Tester aussi la version sans aucun texte : « souvent, c'est plus bas [en CPM] et ça peut dépenser plus ». (MASTER ACQUISITION / 07 — Créer un condor (Partie 2) et / 06 (Partie 1) [01:48] (P2) et [15:13] (P1) : « Si vous mettez du texte, il doit être facile à lire. La typographie doit être normale. […] Rapprochez-vous d'une typographie qu'on retrouve dans les sous-titres. […] Donc ne mettez pas du texte une fois là, ayez des text »)
- Sous-titres des ads générées par IA : CapCut, sous-titres automatiques, style karaoké, police Impact blanche avec contour noir. (RESSOURCES NOTION / 03 — Skill AI Ads Modulable & / 02 — ADS Cartoon IA section Post-prod : « Sous-titres → CapCut, sous-titres auto (style karaoké Impact blanc + contour noir) »)
- Musique : mainstream (elle doit plaire au maximum de monde, jamais un genre clivant), elle doit matcher parfaitement avec le contenu, et idéalement on reprend les musiques trouvées sur des ads winners parce que Facebook a la data dessus et met la créa plus facilement en avant. (MASTER ACQUISITION / 07 — Créer un condor (Partie 2) [03:57]-[04:19] : « Il faut avoir un peu de musique mainstream, c'est-à-dire une musique qui plaît au plus de monde possible. Vous ne pouvez pas mettre de musique rock, sinon ça ne va pas plaire à tous ceux qui n'aiment pas le rock. Et ça d »)
- Voix off : choisir une voix naturelle qui CONVAINC — celle qui termine ses mots sur des sons graves, jamais une intonation qui monte en fin de phrase. Tester jusqu'à 10 voix off différentes sur le même script. (MASTER ACQUISITION / 07 — Créer un condor (Partie 2) [02:51]-[03:35] : « Vous pouvez tester 10 voix off différentes avec le même script. Vous verrez qu'il y en a qui ne vont pas marcher. […] La personne parle et elle termine plus haut, par exemple, et ça, ça ne va pas impacter la personne. Ta »)
- Lumière : une bonne lumière est une condition non négociable, à imposer aux acteurs comme au sourcing de footages. Fond agréable et non perturbant. Demander explicitement aux acteurs de sourire — y compris sur les photos produit — ça change le taux de conversion. (MASTER ACQUISITION / 07 — Créer un condor (Partie 2) [00:00] et [02:29] : « Une bonne lumière c'est indispensable, parce que sans une bonne lumière, je vous garantis, ça ne va pas convertir. […] Demandez à vos acteurs de sourire. Je vous garantis que ça change tout. Si vous avez des photos produ »)
- Direction artistique « méthode Disney » : peu de couleurs, formes arrondies, zéro angle pointu — les formes rondes sont perçues inconsciemment comme positives, elles évoquent la sécurité et le confort ; les pics irritent la conscience. (MASTER ACQUISITION / 06 — Créer un condor (Partie 1) [13:26] : « Disney utilise abondamment les formes arrondies, des animations, même dans le parc à thème, parce que les formes arrondies sont considérées comme positives inconsciemment. Et ça évoque la sécurité et le confort. »)
- Le mashup (assembler plusieurs personnes/extraits différents, en montrant le moins possible de visages, le plus neutre possible) est le format à privilégier pour rester scalable : une ad qui repose sur un seul visage d'acteur UGC est difficilement scalable parce que les autres personas ne se sentent pas concernés. (MASTER ACQUISITION / 06 — Créer un condor (Partie 1) [12:38] : « C'est pour ça que moi j'aime bien pour les ads, c'est faire du mashup, c'est-à-dire prendre plusieurs personnes différentes, essayer de ne pas trop montrer de visages et être le plus neutre possible. »)
- B-rolls : ils n'ont que deux objectifs — PROUVER ou CRÉER UNE ÉMOTION. Structure de démonstration : état avant → action/démonstration → état après visible, sans commentaire. Ajouter de la preuve dans les 20 premières secondes des meilleures ads existantes. (CRÉATIVE INSIGHT / 27 — Ep #37 Le pouvoir de la preuve visuelle [01:33] et [04:26] : « La règle, c'est que vous avez votre script, vous êtes un super copywriter, ok, cool. Maintenant au niveau des b-rolls, il faut que ça prouve, il faut que ça crée une émotion. C'est deux objectifs. […] Vous pouvez aussi u »)
- Attention à la « b-roll fatigue » : réutiliser les mêmes shots qui ont déjà dépensé des millions fait baisser les performances parce que Meta les a déjà vus. Il faut un système qui apporte du footage frais chaque semaine (creators, vidéographes, tournage maison, ou IA). (CRÉATIVE INSIGHT / 58 — Ep #4 Présentation & utilisation de Mirage (= MASTER IA / 27) [00:22] : « Des b-rolls fatigués, c'est quoi ? C'est qu'on avait les mêmes shots qui marchaient très bien, qui avaient dépensé des millions, et que nos vidéo-éditeurs utilisaient encore et encore, même sur des nouveaux scripts, même »)
- Talking head IA (avatar généré) : ne l'utiliser que 2 secondes à la fois dans l'ad, en alternance avec des b-rolls, jamais en plan continu. (CRÉATIVE INSIGHT / 58 — Ep #4 Présentation & utilisation de Mirage (= MASTER IA / 27) [04:47]-[05:10] : « Ce qu'il faut bien sûr tenir compte, c'est qu'on utilise ça seulement pendant 2 secondes dans l'ad. C'est-à-dire, on voit 2 secondes là, 2 secondes là, 2 secondes là… Les gens croient que c'est un cast, mais après, derri »)
- Durées cibles par format : short ad 30 à 90 secondes ; narrative ad 20 à 60 secondes maximum ; skit Arcads 30 secondes à 1 min 30 maximum ; mini-VSL sous 3 minutes ; VSL longue 3 à 10 minutes. (MASTER ACQUISITION / 12 [05:59] ; CRÉATIVE INSIGHT / 35 Ep #29 [03:05] ; CRÉATIVE INSIGHT / 62 Ep #1 [01:31] ; RÉUSSIR SON Q4 / 13 Mastermind [1:05:04] [05:59] / [03:05] / [01:31] / [1:05:04] : « « donnez-lui un script assez simple, pas trop compliqué, d'une ad assez short, 30 à 90 secondes » ; « Idéalement je conseille entre 20 à 60 secondes maximum » ; « Donc là je ferais une ad de 30 à 1 minute 30 maximum sous »)
- Cadrage des acteurs (réels ou IA) : plans suffisamment zoomés pour lire les émotions. Un plan trop large tue l'ad. (CRÉATIVE INSIGHT / 62 — Ep #1 Arcads IA et formats qui convertissent [01:55]-[02:19] : « Ce que je conseille, c'est sourcer pour ceux qui sont assez loin, c'est de zoomer. Là c'est trop loin. Là en fait on a un espace qui est trop loin, on n'arrive pas à lire les émotions. Donc quand vous reprenez vos plans, »)
- Le format Live Test / Ugly Taste doit rester le plus brut possible : filmer la vraie première réaction, idéalement sans cut, sans caption, sans musique, sans editing. Amplifier légèrement l'émotion seulement APRÈS la réaction, jamais avant (sinon ça fait fake). (CRÉATIVE INSIGHT / 29 — Ep #39 Ugly Taste / Look / Live test [04:11] et [04:31] : « Donc garder la publicité la plus brute possible, et puis idéalement sans caption, sans musique, sans editing. […] Il faut voir qu'il… wow, je me sens bien. Et après, il peut amplifier. Après, il peut dire j'ai l'impressi »)
- Statiques : le brief type sort en format 1/1 (1080×1080), 20 ads, en repartant d'un winning design édité sur template Canva ; les autres ratios sont testés dans un second temps. (RESSOURCES NOTION / 50 — Les Statics Secret Sauce (= CRÉATIVE INSIGHT / 53 Ep #14 [07:59]) [07:59] : « Static Brief : Take Winning Design · Use Canva Template To Edit Faster · Output goal : Format 1/1 (1080×1080) · Total ads : 20. […] « ça vous fait une vingtaine d'ads en format 1.1 et après on itère dans d'autres formats »)
- Esthétique d'une statique : lisible et facilement scannable, produit mis en avant par le contraste, fond blanc de préférence (« beaucoup plus visible ») et dégradé si le texte manque de lisibilité. Le cerveau scanne, il ne lit pas. (CRÉATIVE INSIGHT / 53 — Ep #14 Les Statics Secret Sauce ; CRÉATIVE INSIGHT / 03 — Ep #61 [12:54] (Ep #14) et [07:55] (Ep #61) : « En principe, dans l'esthétique, il faut que ce soit lisible et facilement scannable et que le produit soit mis en avant avec un contraste. Quand c'est fond blanc, le produit, il ressort ; des fois avec certains fonds on  »)
- Structure de test des statiques (messaging testing hebdo) : 4 à 5 messages recherchés (pas aléatoires) × 4 visuels chacun, le VISUEL A étant toujours un visuel déjà prouvé pour isoler l'effet du message. Il faut réinjecter en continu de nouveaux visuels (IA ou graphiste) sinon les gens en ont marre de voir les mêmes. (CRÉATIVE INSIGHT / 53 — Ep #14 Les Statics Secret Sauce + RESSOURCES NOTION / 50 [06:08]-[07:59] : « Chaque semaine vous allez venir tester quatre à cinq messages que vous aurez recherchés auparavant. […] Le premier visuel c'est toujours quelque chose de prouvé […] Visuel B c'est un autre visuel, visuel C un autre visue »)
- Règle anti-doublon (« règle des 3 sur 5 ») : pour qu'une itération soit une nouvelle ad aux yeux d'Andromeda, il faut changer TROIS éléments parmi le hook (3 premières secondes + nouveau visuel d'ouverture), le visuel, le texte, la durée, le format (9:16 / 1:1 / 4:5) et le message/angle. L'angle est l'élément le plus important à changer. (MASTER ACQUISITION / 39 — Scaler post-Andromeda (1/4) et / 42 (4/4) [09:02]-[09:46] (39) et [08:48] (42) : « Avant de faire une itération sur une ad qui marche, vous allez venir changer trois éléments. Idéalement, donc il y a le hook, les trois premières secondes […] Vous pouvez changer le texte, les headlines, l'audio, la musi »)
- Hack carrousel : remettre deux winning ads existantes (1:1 ou 9:16) en carrousel suffit à créer un format neuf pour Meta. (CRÉATIVE INSIGHT / 42 — Ep #27 Creative Diversification [05:15] : « Il y a certains ratios comme les carrousels. Carrousel c'est un hack, c'est qu'en fait pour Meta, même si votre ad c'était déjà winner en 1:1, winner en 9:16, le fait que ce soit un carrousel, c'est un nouveau format pou »)
- Miniature : toujours la sélectionner MANUELLEMENT, jamais laisser Meta choisir. Elle doit communiquer clairement l'angle : une partie du hook, un close-up de visage, une réaction, une image étrange ou inhabituelle, ou du rouge. On peut même mettre littéralement le hook en miniature. Un batch de miniatures se teste tous les mois à tous les deux mois. (MASTER ACQUISITION / 36 — Processus de testing ; / 17 — SOP Hooks irrésistibles ; RÉUSSIR SON Q4 / 13 Mastermind [07:18]-[09:38] (36), [11:30] (17), [1:09:19] (Q4/13) : « Ensuite on va venir sélectionner une miniature. Une miniature, ça a un impact important sur la vidéo et vous allez toujours venir sélectionner manuellement. […] vous allez choisir une miniature qui communique clairement  »)
- Placement : toujours laisser « original » et jamais « recommandé », sinon Meta croppe l'image — ce qui impacte énormément les performances. Advantage+ créatif entièrement désactivé sauf « relevant comment ». (MASTER ACQUISITION / 36 — Processus de testing [01:23] : « Des fois ça sélectionne le placement, c'est-à-dire ça va vous dire ça c'est mieux, c'est recommandé. Alors qu'il faut toujours laisser original, sinon ça peut cropper l'image. Donc ça aussi, ça impacte les performances é »)
- Nommage : l'ad set de test se nomme CREATIVE TESTING_(MOIS+N°SEMAINE)_AUDIENCE_NOM DE BATCH_DATE ; une ad qui devient winner est renommée en ajoutant WIN + le mois + le numéro de semaine (les potentiels winners sont marqués POT), puis reportée sur le sheet avec le post-ID, le lien Frame, le spend, le ROAS, la langue, la landing page et la page utilisée. (MASTER ACQUISITION / 36 [03:59], / 37 [06:44] et RESSOURCES GOOGLE / 15 — Document Meta Process (IV. Naming Conventions) [03:59] et [06:44] : « NAMING ADSET : CREATIVE TESTING_(MONTH+WEEKNUMBER)_AUDIENCE_BATCH NAME_DATE → Exemple : CREATIVE TESTING_AU02_BROAD FR_STATIC 12_18.08. […] « Vous allez venir les nommer. Simplement vous gardez le nom de l'ad et vous all »)

**Absent du corpus** : ["LA CHECKLIST « POUR UNE ADS RÉUSSIE » (version simple monteur + version avancée creative strategist) est citée à trois reprises comme LE document de contrôle qualité du montage, mais son contenu n'est JAMAIS énuméré dans le corpus. Un seul critère est cité en exemple : « est-ce que toutes les scènes sont de 3 secondes ? ». Idem pour la « Formation Élite pour tes vidéo éditeurs [MUST HAVE] » : seuls les intitulés de modules sont mentionnés (direct response, tips techniques, tips mindset, responsabilités, état de flow, mash-up, rules & instructions, comment nommer les ads, semaine type, catching hooks, codes d'une ad successful), aucun contenu. → Ces deux documents sont les seuls endroits où se trouveraient des consignes de montage exhaustives ; elles ne sont pas récupérables ici.","DEUX LEÇONS DU MODULE MASTER IA NE SONT PAS TRANSCRITES : / 22 HeyGen (17:10, statut « a-transcrire ») et / 23 Canva IA - branding produit avec IA 2025 (statut « a-transcrire »). Tout ce que la formation dit de HeyGen et de Canva IA est donc inconnu.","AUCUNE SPEC TECHNIQUE D'EXPORT : pas de fps, pas de codec, pas de bitrate, pas de résolution d'export vidéo (les seules résolutions citées sont des paramètres d'outils : 720p/1080p pour le lip sync Kling, 4K pour la génération d'images Nano Banana, 1080×1080 pour le brief statique).","AUCUNE RÈGLE DE SAFE ZONE / ZONE DE TEXTE : rien sur les marges à respecter selon le placement (Reels, Stories), rien sur la règle des 20 % de texte, rien sur la taille de police en px ou en % de hauteur.","AUCUN NOMBRE DE B-ROLLS PAR AD ni de règle « X b-rolls par minute ». Le corpus donne seulement le rythme de coupe (2-3 s) et des durées de b-roll générées (4 secondes par frame dans les pipelines IA), jamais un quota.","AUCUNE SPEC DE CARROUSEL : ni le nombre de slides, ni l'ordre des slides, ni le ratio à utiliser — seulement le fait que le carrousel est un « hack » de format neuf.","RATIO NET NEW / ITÉRATION CONTRADICTOIRE DANS LE CORPUS : le calculateur (RESSOURCES GOOGLE / 30) dit New Creative Tests 60 % / Iterations 40 % ; la vidéo MASTER ACQUISITION / 42 [03:45] dit « 30 à 40 % de net new concept et 60 à 70 % de vraie itération ». Les deux chiffres existent, aucun ne prime explicitement — à arbitrer ailleurs, pas à inventer.","AUCUNE DURÉE CIBLE POUR LES FORMATS SUIVANTS : statique animé, carrousel, listicle vidéo (seul « 3-4 secondes par item » est cité), UGC générique, ads cartoon (seul « les 2 premières secondes doivent être scroll-stopping » est donné), street interview, podcast, docteur, founder story.","LA DIVERSITY MAP DONNE LES NOMS DES 30 STYLES VIDÉO ET 13 STYLES STATIQUES SANS DÉFINITION NI CONSIGNE DE TOURNAGE pour la majorité d'entre eux (Hidden Camera Reaction, Viral Ads, Live Shopping Events, Live Testimonial Video Call, Reel Format, EGC, Live Call With Customer, Gift idea, Clear & creative, Product action shot…). Le tableur ne contient que des statuts Winner / In progress / To Test sur une seule niche (Anti-Régime). Les définitions manquantes ne doivent pas être comblées.","AUCUNE RÈGLE SUR LA LICENCE / LES DROITS MUSICAUX ni sur une banque de musiques à utiliser : seules sources citées = Suno AI et « les musiques retrouvées sur des ads winners ».","AUCUNE CONSIGNE SUR LE PLACEMENT DU LOGO ni sur le respect de la charte graphique en montage vidéo (uniquement, côté statique : « testez avec ou sans votre logo » et « logo optionnel »).","AUCUN LIEN FORMALISÉ ENTRE LA MINIATURE ET LE FICHIER LIVRÉ : la miniature est décrite comme une sélection à faire dans Meta Ads Manager (ou un import manuel), jamais comme un asset à produire et à nommer dans le batch."]
