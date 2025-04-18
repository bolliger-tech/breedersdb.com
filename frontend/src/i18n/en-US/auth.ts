export const auth = {
  email: 'Email',
  password: 'Password',
  signInTitle: 'Sign In',
  signInFooter: 'breedersdb.com',
  signInButton: 'Sign In',
  signOutMessage: 'Are you sure you want to sign out?',
  signOutButton: 'Sign Out',
  errors: {
    401: 'This password is not correct. {nextTry}',
    429: 'Too many failed sign in attempts. {nextTry}',
    404: 'This user was not found.',
    nextTry: 'Next possible try {fromNow}',
    invalidEmail: 'Invalid email address.',
    invalidPasswordOrToken:
      "Invalid password or reset link. Please verify you've opened the full link we sent you by email and you've entered a password.",
    invalidToken:
      "Invalid password reset link. Please verify you've opened the full link we sent you by email.",
    tokenExpired:
      'Password reset link has expired. Please request a new password reset link.',
  },
  forgotPassword: {
    link: 'Forgot password?',
    description:
      'Enter your email address and we will email you a link to reset your password.',
    sendEmail: 'Reset password',
    emailSent:
      'Follow the instructions in the email we just sent you. You can close this window.',
  },
  resetPassword: {
    title: 'Reset password',
    newPassword: 'New password',
    save: 'Set password',
    missingToken:
      'The password reset token is missing. Please make sure you open the full link (without line breaks) we have sent you by email. Try to copy and paste the link in your browser.',
    passwordChanged:
      'Password changed. You can now sign in with your new password.',
  },
};
