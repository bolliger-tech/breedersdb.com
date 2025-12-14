export const users = {
  title: 'User | Users',
  searchPlaceholder: 'Nach E-Mail suchen',
  fields: {
    email: 'E-Mail',
    locale: 'Sprache',
    failedSigninAttempts: 'Fehlerhafte Anmeldeversuche',
    lastSignin: 'Letzte Anmeldung',
    password: 'Passwort',
    newPassword: 'Neues Passwort',
  },
  validation: {
    invalidEmail: 'Ungültige E-Mail-Adresse',
    invalidPassword:
      'Mache das Passwort länger oder komplexer. (8 Zeichen wenn: Großbuchstaben+Kleinbuchstaben+Nummer+Sonderzeichen, 12 Zeichen wenn: Großbuchstaben+Kleinbuchstaben+Nummer, sonst 32 Zeichen)',
    emailNotUnique:
      'Es gibt bereits ein Konto mit dieser E-Mail-Adresse. Bitte nutze das bestehende Konto.',
  },
  deleteConfirmation: 'Benutzer wirklich löschen?',
  changePassword: 'Passwort ändern',
  changePasswordWarning: {
    base: 'Mit der Änderung des Passworts:',
    logoutMe:
      'wirst du sofort auf allen Geräten abgemeldet, einschliesslich diesem',
    logoutOthers: 'wird dieser User sofort auf allen Geräten abgemeldet',
    deletePatMe: 'werden alle deine persönlichen Zugangs-Tokens gelöscht',
    deletePatOthers:
      'werden alle persönlichen Zugangs-Tokens für diesen User gelöscht',
  },
};
