// L'écran OUI (vert) ou NON (rouge) : la réponse du site.
export default function Reponse({ oui, titre, message, children }) {
  return (
    <div className={`reponse ${oui ? 'oui' : 'non'}`} role="alert">
      <div className="mono" style={{ fontSize: 13, letterSpacing: 2 }}>RÉPONSE DU SITE</div>
      <div className="reponse-mot">{oui ? 'OUI' : 'NON'}</div>
      <div className="reponse-titre">{titre}</div>
      {message && <div style={{ fontSize: 18, maxWidth: '28ch' }}>{message}</div>}
      {children}
    </div>
  );
}
