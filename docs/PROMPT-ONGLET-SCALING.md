# Onglet Scaling — historique de la reconstitution

> **18/08, après-midi : IMPLÉMENTÉ.** L'onglet existe désormais en code dans ce repo :
> `/escalier` (`src/lib/escalier.ts` + `EscalierBoard.tsx` + `/api/escalier`), construit
> depuis la SOURCE (formation leçon 35, transcription) et non plus depuis la maquette,
> vérifié par deux agents (fidélité formation + review de code). Voir `MEMO.md`
> § « Onglet Escalier ». Ce fichier ne garde que l'historique de la récupération.

# Prompt — nouvel onglet « Scaling / Cockpit Minuit »

> **Origine.** Le prompt d'origine n'a jamais été poussé : il a été écrit dans une session
> **locale** (desktop, 17/08, branche `claude/roas-marge-gilet-polo-rdce0g` — absente du
> remote). Ce qui a survécu, c'est l'artefact publié **« Cockpit Minuit »**
> (https://claude.ai/code/artifact/8e32e171-cdad-443f-ab6a-694410b0556f, maquette du
> 18/08 · 00h50) et deux fichiers qu'il cite : `formation-master/PROTOCOLE-DECISION.md` §2
> (introuvable dans le dépôt, lui aussi resté en local) et `WEFT_MEMORY_ECOM.md` §4
> (présent sur `claude/formation-gpt-transcriptions-sm1fv6`).
>
> Ce document **reconstitue** le prompt à partir de l'artefact. Les règles ci-dessous sont
> lues sur la maquette, pas sur le protocole d'origine : relire la section « À confirmer »
> avant de lancer l'implémentation.

