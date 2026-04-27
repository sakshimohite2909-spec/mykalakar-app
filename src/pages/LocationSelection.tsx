import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { MapPin, ChevronLeft, Loader2, Search, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const LocationSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'state' | 'district'>('state');
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);
  
  const eventId = searchParams.get('eventId');
  const searchType = searchParams.get('type'); // 'artist' or event-based

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const q = query(collection(db, "states"), orderBy("name"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStates(data);
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      const stateObj = states.find(s => s.name === selectedState);
      if (stateObj && stateObj.districts) {
        setDistricts(stateObj.districts);
      }
    }
  }, [selectedState, states]);

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
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
              {step === 'state' ? "Where is your event located?" : `Select District in ${selectedState}`}
            </h1>
            <p className="text-xl text-muted-foreground">
              {step === 'state' ? "Select your state to find artists in your area" : "Choose the district to find local talent"}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
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
                        {selectedState ? states.find((s) => s.name === selectedState)?.name : "Select your State..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 backdrop-blur-3xl border border-white/50 rounded-2xl shadow-xl z-[100]">
                      <Command className="bg-transparent h-full">
                        <CommandInput placeholder="Search state..." className="h-12 text-sm" />
                        <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden touch-pan-y scroll-smooth">
                          <CommandEmpty className="py-6 text-center text-sm text-slate-500">No state found.</CommandEmpty>
                          <CommandGroup>
                            {states.map((s) => (
                              <CommandItem
                                key={s.id}
                                value={s.name}
                                onSelect={(currentValue) => {
                                  handleStateSelect(s.name);
                                  setStateMenuOpen(false);
                                }}
                                className="cursor-pointer py-3 rounded-xl mx-2 my-1 data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-700"
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
                        {selectedDistrict ? selectedDistrict : `Select District in ${selectedState}...`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 backdrop-blur-3xl border border-white/50 rounded-2xl shadow-xl z-[100]">
                      <Command className="bg-transparent h-full">
                        <CommandInput placeholder="Search district..." className="h-12 text-sm" />
                        <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden touch-pan-y scroll-smooth">
                          <CommandEmpty className="py-6 text-center text-sm text-slate-500">No district found.</CommandEmpty>
                          <CommandGroup>
                            {districts.map((d) => (
                              <CommandItem
                                key={d}
                                value={d}
                                onSelect={(currentValue) => {
                                  handleDistrictSelect(d);
                                  setDistrictMenuOpen(false);
                                }}
                                className="cursor-pointer py-3 rounded-xl mx-2 my-1 data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-700"
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
          )}

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