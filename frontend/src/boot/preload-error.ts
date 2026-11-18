import { defineBoot } from '#q-app/wrappers';
import { reloadOnPreloadError } from 'src/utils/reloadOnPreloadError';

export default defineBoot(() => {
  window.addEventListener('vite:preloadError', reloadOnPreloadError);
});
