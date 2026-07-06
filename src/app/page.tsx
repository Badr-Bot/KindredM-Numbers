export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black px-6 text-center text-zinc-100">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">NIVA Dashboard</p>
      <h1 className="text-xl font-semibold">Scaffold en place — UI en attente du choix de direction design</h1>
      <p className="max-w-md text-sm text-zinc-400">
        Auth, moteur de calcul, schéma Supabase et scripts sont prêts. Les 5 vues
        (§6) arrivent une fois la direction visuelle validée.
      </p>
    </div>
  );
}
