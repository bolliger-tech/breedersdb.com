export const users = {
  title: 'User | Users',
  searchPlaceholder: 'Nach E-Mail suchen',
  fields: {
    email: 'E-Mail',
    locale: 'Sprache',
    failedSigninAttempts: 'Fehlerhafte Anmeldeversuche',
    lastSignin: 'Letzte Anmeldung',
    password: 'Passwort',
    newPassword: 'Neues Passwort'
  },
  validation: {
    invalidEmail: 'Ungültige E-Mail-Adresse',
    invalidPassword: 'Mache das Passwort länger oder komplexer. (8 Zeichen wenn: Großbuchstaben+Kleinbuchstaben+Nummer+Sonderzeichen, 12 Zeichen wenn: Großbuchstaben+Kleinbuchstaben+Nummer, sonst 32 Zeichen)',
    emailNotUnique: 'Es gibt bereits ein Konto mit dieser E-Mail-Adresse. Bitte nutze das bestehende Konto.'
  },
  deleteConfirmation: 'Benutzer wirklich löschen?',
  changePassword: 'Passwort ändern',
  changePasswordWarningOthers: 'Das Ändern des Passworts meldet den Benutzer sofort auf allen Geräten ab!',
  changePasswordWarningMe: 'Das Ändern des Passworts wird dich sofort auf allen Geräten abmelden, einschliesslich diesem!'
};