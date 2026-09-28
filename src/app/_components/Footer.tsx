export default function Footer() {
  return (
    <footer className="w-full p-4 sm:p-6 mt-auto">
      <div className="max-w-6xl mx-auto bg-amber-400 border-2 border-stone-900 shadow-[6px_6px_0px_0px_#1c1917] p-4 sm:p-5 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        <div className="bg-stone-900 text-amber-400 px-4 py-1.5 font-mono font-bold text-sm uppercase tracking-widest border-2 border-stone-900 shadow-[2px_2px_0px_0px_#1c1917] -rotate-1">
          SYS_DEV_TEAM
        </div>
        
        <div className="font-mono text-xs sm:text-sm font-bold uppercase text-stone-900 text-center xl:text-right flex-1 leading-loose tracking-wide">
          <span className="inline-block mx-1 hover:bg-stone-900 hover:text-white px-2 py-0.5 border border-transparent hover:border-stone-900 transition-all cursor-crosshair">RUSHABH MAKWANA</span>
          <span className="opacity-40">::</span>
          <span className="inline-block mx-1 hover:bg-stone-900 hover:text-white px-2 py-0.5 border border-transparent hover:border-stone-900 transition-all cursor-crosshair">RAAJ PATKAR</span>
          <span className="opacity-40">::</span>
          <span className="inline-block mx-1 hover:bg-stone-900 hover:text-white px-2 py-0.5 border border-transparent hover:border-stone-900 transition-all cursor-crosshair">PUSHPANJALI MUKHOPADHYAY</span>
          <span className="opacity-40">::</span>
          <span className="inline-block mx-1 hover:bg-stone-900 hover:text-white px-2 py-0.5 border border-transparent hover:border-stone-900 transition-all cursor-crosshair">YAJAT SHARMA</span>
        </div>

      </div>
    </footer>
  );
}
