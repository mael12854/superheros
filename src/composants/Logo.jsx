// Le blason M² : ne jamais le tourner, l'étirer ou changer ses couleurs.
export default function Logo({ taille = 110, fond = 'clair' }) {
  const bord = Math.max(3, Math.round(taille * 0.064));
  const anneau = Math.max(3, Math.round(taille * 0.055));
  return (
    <div
      className="logo"
      role="img"
      aria-label="Logo de l'Agence M²"
      style={{
        width: taille,
        height: taille,
        border: `${bord}px solid ${fond === 'nuit' ? 'var(--papier)' : '#fff'}`,
        boxShadow: `0 0 0 ${anneau}px var(--rouge)`,
        fontSize: Math.round(taille * 0.4),
      }}
    >
      M²
    </div>
  );
}
