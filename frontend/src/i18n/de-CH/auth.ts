export const auth = {
  email: 'E-Mail',
  password: 'Passwort',
  signInTitle: 'Anmelden',
  signInFooter: 'breedersdb.com',
  signInButton: 'Anmelden',
  signOutMessage: 'Möchtest du dich wirklich abmelden?',
  signOutButton: 'Abmelden',
  errors: {
    401: 'Passwort nicht korrekt. {nextTry}',
    429: 'Zu viele fehlgeschlagene Anmeldeversuche. {nextTry}',
    404: 'User nicht gefunden.',
    nextTry: 'Nächste Versuch in {fromNow}',
    invalidEmail: 'Ungültige E-Mail-Adresse.',
    invalidPasswordOrToken:
      'Ungültiges Passwort oder Link. Bitte stelle sicher, dass du den vollständigen Link aus unserer E-Mail geöffnet und ein Passwort eingegeben hast.',
    invalidToken:
      'Ungültiger oder abgelaufener Link zum Zurücksetzen des Passworts. Bitte einen neuen Link anfordern.',
    tokenExpired:
      'Link zum Zurücksetzen des Passworts ist abgelaufen. Bitte fordere einen neuen Link zum Zurücksetzen des Passworts an.',
  },
  forgotPassword: {
    link: 'Passwort vergessen?',
    description:
      'Gib deine E-Mail-Adresse ein und wir senden dir einen Link, mit dem du dein Passwort zurücksetzen kannst.',
    sendEmail: 'Passwort zurücksetzen',
    emailSent:
      'Folgen den Anweisungen, die wir dir eben per E-Mail geschickt haben. Dieses Fenster kannst du schliessen.',
  },
  resetPassword: {
    title: 'Passwort zurücksetzen',
    newPassword: 'Neues Passwort',
    save: 'Passwort speichern',
    missingToken:
      'Das Passwort-Reset-Token fehlt. Bitte achte darauf, den vollständigen Link (ohne Zeilenumbrüche) aus unserer E-Mail zu öffnen. Falls klicken nicht funktioniert, versuche den Link in die Adresszeile deines Browsers zu kopieren.',
    passwordChanged:
      'Passwort geändert. Du kannst dich jetzt mit dem neuen Passwort anmelden.',
    requestNewToken: 'Link zum Zurücksetzen des Passworts anfordern',
  },
};
