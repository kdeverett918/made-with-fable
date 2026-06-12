export default function Loading() {
  return (
    <main className="board-surface min-h-dvh p-4" aria-label="Loading">
      <div className="brutal-frame grid min-h-[calc(100dvh-2rem)] place-items-center">
        <div className="w-full max-w-3xl px-4 text-center">
          <p className="label-mono text-accent font-bold">Pinning the board</p>
          <div className="border-ink mt-5 h-5 overflow-hidden border-2" aria-hidden>
            <div className="bg-accent h-full w-1/3 animate-[loading-bar_1.1s_var(--ease-out-expo)_infinite]" />
          </div>
          <p className="display-slab mt-8 text-[clamp(4rem,16vw,12rem)]">FABLE</p>
        </div>
      </div>
    </main>
  )
}
