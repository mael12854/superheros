// Serveur API local pour tester sans Vercel : `npm run dev` (avec Vite).
import http from 'node:http';
import { gerer } from './routes.js';
import { modeStockage } from './stockage.js';

const PORT = Number(process.env.PORT_API || 3001);
http.createServer((req, res) => gerer(req, res)).listen(PORT, () => {
  console.log(`API de l'Agence M² sur http://localhost:${PORT} (stockage : ${modeStockage})`);
});
