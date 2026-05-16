import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Navbar from "@/components/Navbar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="not-found-page min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className="page-shell container-shell flex min-h-[calc(100vh-var(--mk-nav-clearance))] items-center justify-center">
        <section className="empty-state-card max-w-xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Search className="h-6 w-6" />
          </span>
          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-widest text-orange-600">404</p>
          <h1 className="mt-2 text-3xl font-extrabold text-stone-950">Page not found</h1>
          <p className="mx-auto mt-3 max-w-md text-base font-medium leading-7 text-stone-600">
            This route does not exist on MyKalakar. Head back to the marketplace and keep exploring verified artists.
          </p>
          <Link to="/" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-[0.98]">
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>
        </section>
      </main>
    </div>
  );
};

export default NotFound;
