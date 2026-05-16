/**
 * LocationSelection.tsx
 *
 * Uses useMasterData() for states → Firestore master_data first, local fallback.
 * Districts are resolved through getDistrictsByState() which hits Firestore
 * (from the legacy `states` collection) then falls back to local static data.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useMasterData } from "@/contexts/MasterDataContext";

// NOTE: No manual wheel-scroll handler needed. CommandList has overflow-y: auto
// from cmdk internals — native mouse-wheel / trackpad / touch scroll works automatically.

const LocationSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { states, getDistrictsByState } = useMasterData();

  const [selectedState,    setSelectedState]    = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [districtOptions,  setDistrictOptions]  = useState<string[]>([]);
  const [step,             setStep]             = useState<"state" | "district">("state");
  const [stateMenuOpen,    setStateMenuOpen]    = useState(false);
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);

  const eventId    = searchParams.get("eventId");
  const searchType = searchParams.get("type");

  // Sort state names alphabetically
  const sortedStates = useMemo(
    () => [...states].sort((a, b) => a.name.localeCompare(b.name)),
    [states]
  );

  // Load districts whenever selectedState changes
  useEffect(() => {
    let active = true;
    if (!selectedState) { setDistrictOptions([]); return; }
    setDistrictOptions([]);
    getDistrictsByState(selectedState)
      .then((opts) => { if (active) setDistrictOptions(opts); })
      .catch((err) => {
        console.error("Failed to load districts:", err);
        if (active) setDistrictOptions([]);
      });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict("");
    setStep("district");
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
  };

  const handleContinue = () => {
    if (!selectedDistrict) return;
    if (searchType === "artist") {
      navigate(`/search?state=${selectedState}&district=${selectedDistrict}&type=artist`);
    } else if (eventId) {
      navigate(
        `/event-requirements?eventId=${eventId}&state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`
      );
    }
  };

  const handleBack = () => {
    if (step === "district") {
      setStep("state");
      setSelectedDistrict("");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="location-page min-h-screen w-full flex flex-col relative font-sans" style={{ background: "var(--app-background)" }}>
      <Navbar />

      <section className="page-shell px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {step === "state"
                ? "Where is your event located?"
                : `Select City / District in ${selectedState}`}
            </h1>
            <p className="text-xl text-muted-foreground">
              {step === "state"
                ? "Select your state to find artists in your area"
                : "Choose the city or district to find local talent"}
            </p>
          </div>

          <>
            {/* ── State selector ── */}
            {step === "state" ? (
              <div className="max-w-md mx-auto mb-12 relative z-10 glass-panel p-6 rounded-3xl">
                <Popover open={stateMenuOpen} onOpenChange={setStateMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={stateMenuOpen}
                      className="w-full h-14 justify-between bg-white/85 border-white/70 !text-[#1A1A1A] rounded-2xl text-sm font-bold tracking-wide shadow-sm hover:bg-white hover:!text-[#1A1A1A] focus:!text-[#1A1A1A] data-[state=open]:!text-[#1A1A1A]"
                    >
                      <span className="truncate !text-[#1A1A1A]">
                        {selectedState || "Select your State…"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#1A1A1A] opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 backdrop-blur-3xl border border-white/50 rounded-2xl shadow-xl z-[100]">
                    <Command className="bg-transparent">
                      <CommandInput
                        placeholder="Search state…"
                        className="h-12 text-sm text-[#1A1A1A] placeholder:text-slate-500"
                      />
                      {/* Native scroll — no onWheelCapture needed */}
                      <CommandList className="max-h-[300px] overflow-y-auto no-scrollbar">
                        <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                          No state found.
                        </CommandEmpty>
                        <CommandGroup>
                          {sortedStates.map((s) => (
                            <CommandItem
                              key={s.id}
                              value={s.name}
                              onSelect={() => {
                                handleStateSelect(s.name);
                                setStateMenuOpen(false);
                              }}
                              className="min-h-11 cursor-pointer rounded-xl mx-2 my-1 px-3 text-[#1A1A1A] data-[selected=true]:bg-orange-50 data-[selected=true]:text-[#1A1A1A]"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-orange-500",
                                  selectedState === s.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              /* ── District selector ── */
              <div className="max-w-md mx-auto mb-12 relative z-10 glass-panel p-6 rounded-3xl">
                <Popover open={districtMenuOpen} onOpenChange={setDistrictMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={districtMenuOpen}
                      className="w-full h-14 justify-between bg-white/85 border-white/70 !text-[#1A1A1A] rounded-2xl text-sm font-bold tracking-wide shadow-sm hover:bg-white hover:!text-[#1A1A1A] focus:!text-[#1A1A1A] data-[state=open]:!text-[#1A1A1A]"
                    >
                      <span className="truncate !text-[#1A1A1A]">
                        {selectedDistrict || `Select City / District in ${selectedState}…`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#1A1A1A] opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 backdrop-blur-3xl border border-white/50 rounded-2xl shadow-xl z-[100]">
                    <Command className="bg-transparent">
                      <CommandInput
                        placeholder="Search city or district…"
                        className="h-12 text-sm text-[#1A1A1A] placeholder:text-slate-500"
                      />
                      {/* Native scroll — overflow-y:auto + max-height */}
                      <CommandList className="max-h-[300px] overflow-y-auto no-scrollbar">
                        <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                          No city found.
                        </CommandEmpty>
                        <CommandGroup>
                          {districtOptions.map((d) => (
                            <CommandItem
                              key={d}
                              value={d}
                              onSelect={() => {
                                handleDistrictSelect(d);
                                setDistrictMenuOpen(false);
                              }}
                              className="min-h-11 cursor-pointer rounded-xl mx-2 my-1 px-3 text-[#1A1A1A] data-[selected=true]:bg-orange-50 data-[selected=true]:text-[#1A1A1A]"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-orange-500",
                                  selectedDistrict === d ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {d}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </>

          {/* ── Continue button ── */}
          {selectedDistrict && step === "district" && (
            <div className="text-center relative z-10">
              <Button
                size="lg"
                onClick={handleContinue}
                className="px-12 rounded-full gradient-bg border-0 text-foreground font-bold h-12"
              >
                {searchType === "artist" ? "Find Artists" : "See Event Requirements"}
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LocationSelection;
