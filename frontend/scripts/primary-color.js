// this script is used by the ansible deployment. don't remove it.

import { config } from 'dotenv';
import { hslToRgb } from './hsl-to-rgb.js';

const envPath = process.argv[2];

if (!envPath) {
  console.error(
    'Please provide the path to the .env file as positional argument.',
  );
  process.exit(1);
}

config({ path: envPath });

const hue = parseInt(process.env.VITE_PRIMARY_COLOR_HUE || '');
const saturation = parseInt(process.env.VITE_PRIMARY_COLOR_SATURATION || '');
const lightness = parseInt(process.env.VITE_PRIMARY_COLOR_LIGHTNESS || '');
const color =
  Number.isNaN(hue) || Number.isNaN(saturation) || Number.isNaN(lightness)
    ? undefined
    : `#${hslToRgb(hue, saturation, lightness)}`;

console.log(color);
