import { QIconProps } from 'quasar';
import { SpriteIcons } from './types';

// a dedicated file is used, because we need the interface
// in a composable and non-components can't import from .vue files
// (src/components/Layout/TheNav/useNavItem.ts)
export interface BaseSpriteIconProps extends QIconProps {
  name: SpriteIcons;
}
