// Premier écran des contrôles : agent ou visiteur ?
export default function ChoixQui({ sens, onChoix }) {
  return (
    <div className="etape">
      <div className="etape-haut">
        <div className="etape-infos"><span>CONTRÔLE {sens === 'entree' ? 'D\'ENTRÉE' : 'DE SORTIE'}</span><span style={{ color: sens === 'entree' ? 'var(--rouge)' : 'var(--bleu)' }}>● {sens === 'entree' ? 'NIVEAU MAX' : 'NIVEAU NORMAL'}</span></div>
      </div>
      <div className="etape-corps">
        <div className="etape-question">Qui es-tu ?</div>
        <button className="btn principal large" type="button" onClick={() => onChoix('agent')} autoFocus>Je suis un agent</button>
        <button className="btn large" type="button" onClick={() => onChoix('visiteur')}>Je suis un visiteur</button>
        <a href="/visiteurs" style={{ textAlign: 'center' }}>Pas encore de compte visiteur ?</a>
      </div>
    </div>
  );
}
