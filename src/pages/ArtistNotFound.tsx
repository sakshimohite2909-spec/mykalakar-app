import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nProvider";
import Navbar from "@/components/Navbar";

export function ArtistNotFound() {
  const { t } = useI18n();
  return (
    <div className="profile-page min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className="page-shell container-shell flex min-h-[70vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-extrabold text-stone-950">{t("artist.notFoundTitle") || "Artist Not Found"}</h1>
        <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-stone-500">
          {t("artist.notFoundText") || "The artist profile you are looking for does not exist or has been removed."}
        </p>
        <Link 
          to="/artists" 
          className="mt-5 inline-flex h-10 items-center rounded-full bg-stone-950 px-5 text-xs font-extrabold text-white transition hover:bg-stone-800"
        >
          {t("artist.backToArtists") || "Back to Artists"}
        </Link>
      </main>
    </div>
  );
}

export default ArtistNotFound;
