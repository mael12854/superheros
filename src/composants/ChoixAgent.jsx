import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Liste déroulante des agents (pour les chefs).
export function useAgents() {
  const [agents, setAgents] = useState(null);
  const [erreur, setErreur] = useState('');
  const charger = () => api('agents').then((r) => setAgents(r.agents)).catch((e) => setErreur(e.message));
  useEffect(() => { charger(); }, []);
  return { agents, erreur, charger };
}

export default function ChoixAgent({ agents, valeur, onChange }) {
  return (
    <label className="etiquette pas-imprimer" style={{ maxWidth: 360 }}>
      <span>Agent</span>
      <select className="champ" value={valeur || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">— choisir —</option>
        {agents?.map((a) => <option key={a.id} value={a.id}>{a.numero} · {a.nomHeros}</option>)}
      </select>
    </label>
  );
}
