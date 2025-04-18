import { useRoute, useRouter } from 'vue-router';
import { getUserFromCookie } from 'src/utils/authUtils';

export function useRedirectAuthenticatedUsers() {
  const route = useRoute();
  const router = useRouter();

  async function redirect() {
    const redirect = route.query.redirect as string | undefined;
    await router.push({ path: redirect || '/' });
  }

  async function redirectIfAuthenticated() {
    if (getUserFromCookie()) {
      await redirect();
    }
  }

  return {
    redirect,
    redirectIfAuthenticated,
  };
}
