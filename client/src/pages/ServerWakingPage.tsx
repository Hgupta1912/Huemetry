export default function ServerWakingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 bg-white">
      <img src="/logo.svg" alt="Huemetry" className="w-full px-6 object-contain" />
      <p className="font-display text-4xl uppercase text-ink text-center">Huemetry</p>
      <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
    </main>
  );
}