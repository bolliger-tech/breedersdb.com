import { getUserFromCookie } from 'src/utils/authUtils';
import { ref } from 'vue';

// this only uses the user from the cookie atm
// later we can add a graphql query to get the user
export function useMe() {
  const meFromCookie = ref(getUserFromCookie());
  return meFromCookie;
}
