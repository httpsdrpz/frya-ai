export function LandingBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-hero-glow absolute left-1/2 top-16 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(11,107,58,0.2)_0%,rgba(11,107,58,0.08)_45%,rgba(11,107,58,0)_72%)] blur-[110px]" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:92px_92px] opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#020403_0%,rgba(2,4,3,0.76)_16%,rgba(2,4,3,0.16)_38%,rgba(2,4,3,0)_52%,rgba(2,4,3,0.28)_74%,#020403_100%)]" />
    </>
  );
}
