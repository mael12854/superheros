import { useEffect, useState } from 'react';
import Page, { useSession } from '../composants/Page.jsx';
import { ConnexionChef } from '../composants/Chef.jsx';
import { api } from '../lib/api.js';
import { sirene } from '../lib/son.js';

export default function Alarme() {
  const [alarme, setAlarme] = useState(null);
  const [son, setSon] = useState(false);
  const session = useSession();

  useEffect(() => {
    const charger = () => api('alarme').then(setAlarme).catch(() => {});
    charger();
    const t = setInterval(charger, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!alarme?.active || !son) return undefined;
    return sirene();
  }, [alarme?.active, son]);

  async function arreter() {
    await api('alarme/arret', { methode: 'POST', corps: {} });
    setAlarme(await api('alarme'));
  }

  if (alarme?.active) {
    return (
      <div className="alarme-ecran" style={{ position: 'fixed', overflow: 'auto' }}>
        <div className="mono" style={{ letterSpacing: 3 }}>{alarme.raison || 'ALERTE'}</div>
        <div className="grand">ALARME</div>
        <div className="mono">depuis {new Date(alarme.depuis).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="rangee" style={{ justifyContent: 'center' }}>
          <button className="btn" type="button" onClick={() => setSon(!son)}>{son ? 'Couper le son' : 'Allumer la sirène'}</button>
          {session && <button className="btn principal" type="button" onClick={arreter}>Arrêter l'alarme</button>}
        </div>
        {!session && <div style={{ color: 'var(--nuit)', textAlign: 'left' }}><ConnexionChef /></div>}
      </div>
    );
  }

  return (
    <Page numero="OUTIL · BONUS" titre="Alarme" intro="L'alarme se déclenche toute seule après 3 NON de suite au contrôle d'entrée. Laisse cette page ouverte sur un écran du QG : elle devient rouge et sonne quand ça arrive.">
      <div className="carte ombre" style={{ maxWidth: 520, background: 'var(--vert)', color: '#fff' }}>
        <span style={{ fontFamily: 'var(--titre)', fontSize: 28 }}>Tout est calme</span>
        {alarme?.arreteePar && <span>Dernière alarme arrêtée par {alarme.arreteePar}.</span>}
        <button className="btn" type="button" onClick={() => setSon(true)} disabled={son}>{son ? 'Sirène prête ✓' : 'Autoriser la sirène sur cet écran'}</button>
      </div>
    </Page>
  );
}
