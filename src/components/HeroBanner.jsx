import { Link } from "react-router-dom";

export default function HeroBanner() {
  return (
    <section className="mt-6 bg-white px-4 pb-10 pt-6 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-600">
            FOR ARTISTS AND ORGANIZERS
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
            One polished profile. Faster event discovery.
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-black">
            Build a credible artist presence or publish an event brief and let the platform connect the flow.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-orange-500 px-6 text-sm font-black text-black shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
            >
              Join as Artist
            </Link>
            <Link
              to="/event-requirements"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-[#F9FAFB] px-6 text-sm font-black text-black transition hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              Post Event
            </Link>
          </div>
        </div>

        <div className="relative min-h-[340px] overflow-hidden rounded-lg border border-gray-200 bg-[#F9FAFB] shadow-sm sm:min-h-[420px]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#FFFFFF_0%,#F9FAFB_52%,#FFF7ED_100%)]" />
          <div className="relative grid h-full min-h-[340px] gap-4 p-5 sm:min-h-[420px] sm:grid-cols-[1fr_0.86fr]">
            <div className="grid gap-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-36 rounded-lg bg-[linear-gradient(135deg,#111827_0%,#3F3F46_58%,#EA580C_100%)]" />
                <div className="mt-4 h-3 w-32 rounded-full bg-gray-900" />
                <div className="mt-2 h-2 w-44 rounded-full bg-gray-200" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 rounded-lg border border-gray-200 bg-white shadow-sm" />
                <div className="h-20 rounded-lg border border-gray-200 bg-orange-50 shadow-sm" />
                <div className="h-20 rounded-lg border border-gray-200 bg-white shadow-sm" />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-3 w-24 rounded-full bg-orange-500" />
                <div className="mt-5 grid gap-3">
                  <div className="h-10 rounded-lg bg-[#F9FAFB]" />
                  <div className="h-10 rounded-lg bg-[#F9FAFB]" />
                  <div className="h-10 rounded-lg bg-[#F9FAFB]" />
                </div>
              </div>

              <div className="relative min-h-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="absolute inset-x-0 top-0 h-14 bg-orange-500" />
                <div className="absolute bottom-4 left-4 right-4 grid gap-2">
                  <div className="h-3 rounded-full bg-gray-900" />
                  <div className="h-2 w-3/4 rounded-full bg-gray-200" />
                  <div className="h-2 w-1/2 rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
