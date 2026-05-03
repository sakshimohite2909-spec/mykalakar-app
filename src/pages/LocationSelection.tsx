import { useState, useEffect, useMemo, type WheelEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { getIndiaDistrictsByStateName, getIndiaStates } from "@/lib/indiaLocations";

const scrollDropdownOnWheel = (event: WheelEvent<HTMLElement>) => {
  const target = event.currentTarget;
  if (target.scrollHeight <= target.clientHeight) return;

  target.scrollTop += event.deltaY;
  event.preventDefault();
  event.stopPropagation();
};

const LocationSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [step, setStep] = useState<'state' | 'district'>('state');
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);
  
  const eventId = searchParams.get('eventId');
  const searchType = searchParams.get('type'); // 'artist' or event-based

  const indianStates = useMemo(
    () => getIndiaStates(),
    []
  );

  useEffect(() => {
    let active = true;

    if (!selectedState) {
      setCityOptions([]);
      return () => {
        active = false;
      };
    }

    setCityOptions([]);
    getIndiaDistrictsByStateName(selectedState)
      .then((options) => {
        if (active) setCityOptions(options);
      })
      .catch((error) => {
        console.error("Failed to load districts", error);
        if (active) setCityOptions([]);
      });

    return () => {
      active = false;
    };
  }, [selectedState]);

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict("");
    setStep('district');
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
  };

  const handleContinue = () => {
    if (selectedDistrict) {
      if (searchType === 'artist') {
        navigate(`/search?state=${selectedState}&district=${selectedDistrict}&type=artist`);
      } else if (eventId) {
        navigate(`/event-requirements?eventId=${eventId}&state=${selectedState}&district=${selectedDistrict}`);
      }
    }
  };

  const handleBack = () => {
    if (step === 'district') {
      setStep('state');
      setSelectedDistrict("");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-transparent font-sans">
      <Navbar />
      
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {step === 'state' ? "Where is your event located?" : `Select City / District in ${selectedState}`}
            </h1>
            <p className="text-xl text-muted-foreground">
              {step === 'state' ? "Select your state to find artists in your area" : "Choose the city or district to find local talent"}
            </p>
          </div>

          <>
              {step === 'state' ? (
                <div className="max-w-md mx-auto mb-12 relative z-10 glass-panel p-6 rounded-3xl">
                  <Popover open={stateMenuOpen} onOpenChange={setStateMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={stateMenuOpen}
                        className="w-full h-14 justify-between bg-white/40 border-white/50 text-[#1A1A1A] rounded-2xl text-sm font-bold tracking-wide hover:bg-white/60 shadow-sm"
                      >
                        {selectedState || "Select your State..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 backdrop-blur-3xl border border-white/50 rounded-2xl shadow-xl z-[100]">
                      <Command className="bg-transparent h-full">
                        <CommandInput placeholder="Search state..." className="h-12 text-sm" />
                        <CommandList
                          className="dropdown-scroll-area max-h-[min(320px,48vh)] touch-pan-y scroll-smooth"
                          onWheelCapture={scrollDropdownOnWheel}
                        >
                          <CommandEmpty className="py-6 text-center text-sm text-slate-500">No state found.</CommandEmpty>
                          <CommandGroup>
                            {indianStates.map((s) => (
                              <CommandItem
                                key={s.isoCode}
                                value={s.name}
                                onSelect={() => {
                                  handleStateSelect(s.name);
                                  setStateMenuOpen(false);
                                }}
                                className="min-h-11 cursor-pointer rounded-xl mx-2 my-1 px-3 data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-700"
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
                <div className="max-w-md mx-auto mb-12 relative z-10 glass-panel p-6 rounded-3xl">
                  <Popover open={districtMenuOpen} onOpenChange={setDistrictMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={districtMenuOpen}
                        className="w-full h-14 justify-between bg-white/40 border-white/50 text-[#1A1A1A] rounded-2xl text-sm font-bold tracking-wide hover:bg-white/60 shadow-sm"
                      >
                        {selectedDistrict || `Select City / District in ${selectedState}...`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 backdrop-blur-3xl border border-white/50 rounded-2xl shadow-xl z-[100]">
                      <Command className="bg-transparent h-full">
                        <CommandInput placeholder="Search city or district..." className="h-12 text-sm" />
                        <CommandList
                          className="dropdown-scroll-area max-h-[min(320px,48vh)] touch-pan-y scroll-smooth"
                          onWheelCapture={scrollDropdownOnWheel}
                        >
                          <CommandEmpty className="py-6 text-center text-sm text-slate-500">No city found.</CommandEmpty>
                          <CommandGroup>
                            {cityOptions.map((d) => (
                              <CommandItem
                                key={d}
                                value={d}
                                onSelect={() => {
                                  handleDistrictSelect(d);
                                  setDistrictMenuOpen(false);
                                }}
                                className="min-h-11 cursor-pointer rounded-xl mx-2 my-1 px-3 data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-700"
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

          {selectedDistrict && step === 'district' && (
            <div className="text-center relative z-10">
              <Button 
                size="lg" 
                onClick={handleContinue}
                className="px-12 rounded-full gradient-bg border-0 text-foreground font-bold h-12"
              >
                {searchType === 'artist' ? 'Find Artists' : 'See Event Requirements'}
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
