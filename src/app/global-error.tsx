
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-[#0d0d12] text-white font-sans">
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter">System Critical Failure</h2>
          <p className="text-muted-foreground">The entire arena system has experienced a fatal exception.</p>
          <button
            onClick={() => reset()}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl"
          >
            Try Global Restart
          </button>
        </div>
      </body>
    </html>
  );
}
