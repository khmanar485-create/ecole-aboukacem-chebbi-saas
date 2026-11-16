# École Aboukacem Chebbi — SaaS scolaire multi-écoles

Version révisée selon les décisions : **SaaS multi-écoles**, PostgreSQL avec SQL direct via `pg` (sans Prisma).

## Stack
- Frontend : React 18 + Vite
- Backend : Node.js + Express
- Base de données : PostgreSQL + `pg` (requêtes SQL paramétrées)
- Authentification : JWT + bcrypt
- Isolation multi-tenant : chaque donnée scolaire est liée à `school_id`; les routes d'établissement filtrent par l'école du compte connecté.
- UI française et responsive, manifeste PWA de base

## Prérequis
Node.js 20 ou supérieur recommandé, npm, PostgreSQL 15+.

## Installation locale (Windows)
1. Créer une base PostgreSQL nommée `ecole_saas` dans pgAdmin.
2. Copier `backend/.env.example` vers `backend/.env`, puis renseigner le mot de passe PostgreSQL dans `DATABASE_URL` et remplacer `JWT_SECRET` par une longue valeur aléatoire.
3. À la racine du projet :
   ```cmd
   npm install
   npm run install:all
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
4. Ouvrir `http://localhost:5173`. API : `http://localhost:4000/api/health`.

## Comptes de démonstration
Mot de passe commun : `Demo123!`
- Administrateur SaaS : `saas@demo.tn`
- Directeur : `direction@demo.tn`
- Enseignant : `enseignant@demo.tn`
- Comptable : `compta@demo.tn`
- Parent : `parent@demo.tn`
- Élève : `eleve@demo.tn`

Comptes de démonstration uniquement : ne pas les conserver en production.

## Structure
- `backend/sql/001_init.sql` : schéma PostgreSQL initial
- `backend/scripts/migrate.js` : exécution des migrations SQL
- `backend/scripts/seed.js` : données de démonstration
- `backend/src/server.js` : API Express, JWT, RBAC, périmètre école, CRUD, messagerie et indicateurs
- `frontend/` : application React

## Périmètre fonctionnel à finaliser avant production
Le socle comprend l'authentification, la séparation par établissement, la gestion CRUD de base pour élèves/classes/matières/enseignants/salles/paiements/devoirs/annonces/emploi du temps, la messagerie, les journaux d'activité et des indicateurs calculés à partir de PostgreSQL. Les parcours avancés restent à compléter et tester : préinscriptions avec validation, gestion fine des rôles et liens parent-enfant, calcul complet des moyennes et bulletins PDF, justificatifs d'absences, dépôt et correction de devoirs, reçus PDF et relances, détection exhaustive des conflits de salles/enseignants, annonces immuables, notifications e-mail/push, exports CSV/Excel, stockage privé des pièces jointes, sauvegardes/restauration, et tests de sécurité multi-tenant.

## Sécurité / déploiement
Ne pas déployer avec les secrets ou comptes de démonstration. Avant toute utilisation avec de vraies données d'enfants : audit des autorisations et de l'isolation tenant, HTTPS, validation des entrées, limitation de débit, politique de conservation/consentement, stockage privé avec contrôle antivirus, sauvegardes quotidiennes testées, tests automatisés et vérification des obligations légales applicables. Les notifications enregistrées en base ne constituent pas un envoi e-mail ou push tant qu'un fournisseur n'est pas configuré.

Pour Render ou un autre hébergeur, configurer une base PostgreSQL managée, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, puis lancer `npm run db:migrate` comme étape de déploiement. Aucun générateur Prisma n'est utilisé.
