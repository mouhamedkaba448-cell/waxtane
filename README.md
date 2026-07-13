# WAXTAN — Guide de démarrage (version Web)

## 1. Configurer Supabase
1. Crée un compte sur https://supabase.com et un nouveau projet nommé `waxtan`.
2. Va dans **SQL Editor** → colle le contenu de `supabase/schema.sql` → **Run**.
3. Va dans **Storage** → crée un nouveau bucket **public** nommé `post-images` (pour les images des posts).
4. Va dans **Project Settings > API** → note ton **Project URL** et ta **anon public key**.

## 2. Configurer le projet web (VS Code)
1. Ouvre le dossier `web/` dans VS Code.
2. Copie `.env.example` en `.env` et colle tes clés Supabase dedans.
3. Dans le terminal VS Code :
   ```
   npm install
   npm run dev
   ```
4. Ouvre http://localhost:5173

## 3. Devenir administrateur
1. Inscris-toi normalement dans l'app (bouton "S'inscrire").
2. Dans Supabase → **Authentication > Users**, copie ton UUID.
3. Dans **SQL Editor**, lance :
   ```sql
   update public.profiles set is_admin = true where id = 'TON_UUID_ICI';
   ```
4. Reconnecte-toi : le lien "🛠 Admin" apparaît dans la barre de navigation.

## 4. Fonctionnalités déjà en place
- Inscription/connexion (email + mot de passe 8 caractères min.)
- Navigation possible sans compte (lecture seule)
- Posts texte libre + image optionnelle, classés par catégorie
- Like / unlike, commentaires illimités, partage par lien, signalement
- Panneau admin : traiter les signalements, voir les suggestions, bannir des comptes
- Page de suggestions aux développeurs
- Bouton "Buy me a coffee" (remplace le lien dans `src/components/DonateButton.jsx`)

## 5. À venir (prochaines étapes)
- Déploiement gratuit du web (Vercel / Netlify / Cloudflare Pages)
- Intégration Google AdMob (pub) — se fait au niveau de l'app mobile
- Version mobile avec Expo (même base Supabase)

## 6. Déploiement gratuit du web
- **Vercel** : connecte ton repo GitHub, "Import project", ajoute les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les settings, déploie.
- Même principe pour **Netlify** ou **Cloudflare Pages**.
