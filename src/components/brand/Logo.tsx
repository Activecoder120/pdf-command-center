import logo from "@/assets/pdfbuddy-logo.jpeg";

export function Logo({ withText = true, className = "" }: { withText?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-white/10">
        <img src={logo} alt="PDFBuddy" className="h-full w-full object-cover" />
      </div>
      {withText && (
        <div className="leading-none">
          <div className="font-display text-[15px] font-semibold tracking-tight text-foreground">
            PDFBuddy
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            PDF Tools
          </div>
        </div>
      )}
    </div>
  );
}
