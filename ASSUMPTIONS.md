# Hypotheses Metier

1. Une personne peut exister avant la creation de son compte applicatif.
Consequence : `Person` et `User` restent dissocies, avec un lien optionnel.

2. Un utilisateur n'a qu'un role principal dans la demo, meme si le modele supporte plusieurs roles.
Consequence : l'interface affiche un role courant, mais le RBAC sait agreger plusieurs permissions.

3. La signature attendue est une preuve interne de lecture / engagement.
Consequence : la signature enregistre l'utilisateur, la date, la version du document, l'IP et le user-agent, sans pretendre fournir une signature electronique qualifiee.

4. Les workflows onboarding et offboarding restent intentionnellement simples en v1.
Consequence : ils s'appuient sur une checklist horodatee et un pourcentage de completion, sans moteur BPM externe.

5. Les integrations Microsoft, AD, Graph et provisioning sont isolees derriere des connecteurs mock.
Consequence : la v1 fonctionne 100% en local sans dependance externe reelle.

6. Les managers consultent la demo avec une visibilite elargie, sans filtrage recursif fin par equipe.
Consequence : le modele permet les rattachements et la hiérarchie, mais les regles de portee manager restent simplifiees pour la demonstration.

7. Les notifications v1 sont purement internes.
Consequence : elles sont stockees en base et exposees dans un centre de notifications UI ; l'envoi email n'est pas active, mais l'architecture peut l'accueillir.

8. Les donnees de seed sont realistes mais fictives.
Consequence : elles servent la demonstration produit et les tests automatises, pas un usage operationnel reel.

