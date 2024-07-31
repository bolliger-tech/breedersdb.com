export const users = {
  title: 'User | Users',
  searchPlaceholder: 'Search by email',
  fields: {
    email: 'Email',
    locale: 'Locale',
    failedSigninAttempts: 'Failed signin attempts',
    lastSignin: 'Last signin',
    password: 'Password',
    newPassword: 'New Password'
  },
  validation: {
    invalidEmail: 'Invalid email address',
    invalidPassword: 'Make the password longer or more complex. (8 characters if: uppercase+lowercase+number+special character, 12 characters if: uppercase+lowercase+number, 32 characters otherwise)',
    emailNotUnique: 'There is already an account with this email address. Please use the existing account.'
  },
  deleteConfirmation: 'Are you sure you want to delete this user?',
  changePassword: 'Change Password',
  changePasswordWarningOthers: 'Changing the password will immediately log out the user on all devices!',
  changePasswordWarningMe: 'Changing the password will immediately log you out on all devices, including this one!'
};