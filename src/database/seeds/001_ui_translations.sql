-- ============================================================
-- Seed: Core UI translations (English + French)
-- ============================================================

INSERT INTO public.ui_translations (key, content_en, content_fr, category) VALUES
  -- Common
  ('common.save',           'Save',           'Enregistrer',       'common'),
  ('common.cancel',         'Cancel',         'Annuler',           'common'),
  ('common.delete',         'Delete',         'Supprimer',         'common'),
  ('common.edit',           'Edit',           'Modifier',          'common'),
  ('common.loading',        'Loading...',     'Chargement...',     'common'),
  ('common.error',          'An error occurred', 'Une erreur est survenue', 'common'),
  ('common.success',        'Success',        'Succès',            'common'),
  ('common.search',         'Search',         'Rechercher',        'common'),
  ('common.back',           'Back',           'Retour',            'common'),
  ('common.next',           'Next',           'Suivant',           'common'),
  ('common.submit',         'Submit',         'Soumettre',         'common'),
  -- Auth
  ('auth.login',            'Log In',         'Se connecter',      'auth'),
  ('auth.logout',           'Log Out',        'Se déconnecter',    'auth'),
  ('auth.register',         'Register',       'S''inscrire',       'auth'),
  ('auth.email',            'Email',          'E-mail',            'auth'),
  ('auth.password',         'Password',       'Mot de passe',      'auth'),
  ('auth.forgot_password',  'Forgot password?', 'Mot de passe oublié ?', 'auth'),
  ('auth.google_login',     'Continue with Google', 'Continuer avec Google', 'auth'),
  ('auth.role_tenant',      'I am looking for a home', 'Je cherche un logement', 'auth'),
  ('auth.role_landlord',    'I am a landlord/agent',   'Je suis propriétaire/agent', 'auth'),
  -- Navigation
  ('nav.home',              'Home',           'Accueil',           'navigation'),
  ('nav.listings',          'Listings',       'Annonces',          'navigation'),
  ('nav.profile',           'Profile',        'Profil',            'navigation'),
  ('nav.settings',          'Settings',       'Paramètres',        'navigation'),
  ('nav.dashboard',         'Dashboard',      'Tableau de bord',   'navigation'),
  -- Language settings
  ('settings.language',     'Language',       'Langue',            'settings'),
  ('settings.language_en',  'English',        'Anglais',           'settings'),
  ('settings.language_fr',  'French',         'Français',          'settings'),
  -- Currency
  ('currency.fcfa',         'FCFA',           'FCFA',              'currency'),
  ('currency.price',        'Price',          'Prix',              'currency'),
  ('currency.per_month',    'per month',      'par mois',          'currency'),
  -- Listings
  ('listing.rent',          'For Rent',       'À louer',           'listings'),
  ('listing.sale',          'For Sale',       'À vendre',          'listings'),
  ('listing.bedrooms',      'Bedrooms',       'Chambres',          'listings'),
  ('listing.bathrooms',     'Bathrooms',      'Salles de bain',    'listings'),
  ('listing.location',      'Location',       'Emplacement',       'listings'),
  -- Validation
  ('validation.required',   'This field is required', 'Ce champ est obligatoire', 'validation'),
  ('validation.email',      'Invalid email address',  'Adresse e-mail invalide',  'validation'),
  ('validation.min_length', 'Too short',      'Trop court',        'validation'),
  ('validation.max_length', 'Too long',       'Trop long',         'validation')
ON CONFLICT (key) DO NOTHING;
