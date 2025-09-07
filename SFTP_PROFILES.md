# Système de Profils de Connexion SFTP

## Aperçu

Le gestionnaire SFTP inclut maintenant un système complet de gestion des profils de connexion qui permet de sauvegarder, organiser et réutiliser facilement vos configurations de connexion.

## Fonctionnalités

### ✅ Gestion des Profils
- **Sauvegarde de connexions** : Enregistrez vos configurations de connexion avec un nom personnalisé
- **Chiffrement des mots de passe** : Les mots de passe sont automatiquement chiffrés avant sauvegarde
- **Connexion rapide** : Sélectionnez un profil et connectez-vous en un clic
- **Historique d'utilisation** : Les profils sont triés par date de dernière utilisation

### ✅ Interface Utilisateur
- **Liste déroulante** : Sélection rapide des profils dans le dialog de connexion
- **Gestion visuelle** : Interface dédiée pour créer, modifier et supprimer les profils
- **Profils récents** : Affichage des 3 derniers profils utilisés
- **Accès depuis la sidebar** : Bouton de configuration directement accessible

### ✅ Sécurité
- **Chiffrement AES-256** : Protection des mots de passe avec chiffrement robuste
- **Fallback Base64** : Système de sauvegarde en cas d'erreur de chiffrement
- **Stockage serveur** : Les profils sont sauvegardés dans un fichier JSON sécurisé sur le serveur

## Utilisation

### Sauvegarder un Profil de Connexion

1. Remplissez les champs de connexion (hôte, port, nom d'utilisateur, mot de passe)
2. Cliquez sur le bouton **"Sauvegarder"** dans la section "Profils sauvegardés"
3. Donnez un nom descriptif à votre profil (ex: "Serveur Production", "VPS Personnel")
4. Le profil est automatiquement sauvegardé avec chiffrement du mot de passe

### Utiliser un Profil Existant

1. Ouvrez le dialog de connexion
2. Sélectionnez un profil dans la liste déroulante
3. Cliquez sur **"Charger"** pour pré-remplir les champs
4. Cliquez sur **"Se connecter"**

### Gérer les Profils

1. Cliquez sur le bouton **"Gérer"** dans la section profils
2. **Créer** : Ajoutez un nouveau profil manuellement
3. **Modifier** : Éditez les informations d'un profil existant
4. **Supprimer** : Supprimez définitivement un profil

## Architecture Technique

### API Routes

- **GET/POST/PUT/DELETE** `/api/sftp/profiles` : CRUD des profils
- **POST** `/api/sftp/profiles/use` : Marquer un profil comme utilisé

### Stockage

- **Fichier** : `/data/sftp-profiles.json`
- **Format** : JSON avec métadonnées (création, dernière utilisation)
- **Chiffrement** : Mots de passe chiffrés avec AES-256-CBC

### Structure des Données

```typescript
interface SFTPProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string; // Chiffré
  createdAt: string;
  lastUsed?: string;
}
```

## Exemples d'Utilisation

### Profil Serveur de Production
- **Nom** : "Serveur Production"
- **Hôte** : "prod.monsite.com"
- **Port** : 22
- **Utilisateur** : "deploy"

### Profil VPS Personnel
- **Nom** : "Mon VPS OVH"
- **Hôte** : "51.75.xxx.xxx"
- **Port** : 2222
- **Utilisateur** : "root"

### Profil Local
- **Nom** : "Serveur Local"
- **Hôte** : "localhost"
- **Port** : 22
- **Utilisateur** : "pilote"

## Sécurité et Bonnes Pratiques

1. **Mots de passe forts** : Utilisez des mots de passe complexes
2. **Noms descriptifs** : Donnez des noms clairs à vos profils
3. **Rotation régulière** : Changez régulièrement les mots de passe
4. **Sauvegarde** : Le fichier de profils peut être sauvegardé séparément

## Migration depuis l'Ancien Système

L'ancien système de sauvegarde des identifiants (localStorage) reste disponible pour compatibilité. Le nouveau système de profils est recommandé pour une meilleure sécurité et organisation.