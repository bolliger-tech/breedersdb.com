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
    forgotPassword: {
      link: 'Forgot password?',
      description:
        'Enter your email address and we will email you a link to reset your password.',
      sendEmail: 'Reset password',
      emailSent:
        'Follow the instructions in the email we just sent you. You can close this window.',
    },
  },
};
