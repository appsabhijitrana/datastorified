import type { ResultSectionLayoutProps } from "./resultTypes";

export function ResultSectionLayout({ title, description, kicker, children, aside, className }: ResultSectionLayoutProps) {
  return (
    <section className={className}>
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0">
          {kicker ? <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{kicker}</p> : null}
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
