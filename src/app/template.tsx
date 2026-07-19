/**
 * Remonté à chaque navigation (contrairement à layout) : anime l'arrivée de
 * chaque page — fondu + légère montée, façon planche qui se pose.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
