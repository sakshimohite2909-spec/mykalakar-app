import { Link } from "react-router-dom";

export default function HeroBanner() {
  return (
    <section className="bg-white px-4 py-16 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-600">
            FOR ARTISTS AND ORGANIZERS
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            One polished profile. Faster event discovery.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black">
            Build a credible artist presence or publish an event brief and let the platform connect the flow.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-orange-500 px-6 text-sm font-bold text-black shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
            >
              Join as Artist
            </Link>
            <Link
              to="/event-requirements"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-6 text-sm font-bold text-black transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Post Event
            </Link>
          </div>
        </div>

        <div className="min-h-[320px] rounded-lg border border-slate-200 bg-slate-50 shadow-sm sm:min-h-[420px]">
          <div className="h-full min-h-[320px] rounded-lg bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_46%,#f8fafc_100%)] sm:min-h-[420px]" />
        </div>
      </div>
    </section>
  );
}
