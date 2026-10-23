// Seule fonction Vercel : toutes les routes /api/* arrivent ici (voir vercel.json).
import { gerer } from '../server/routes.js';

export default function handler(req, res) {
  return gerer(req, res);
}
