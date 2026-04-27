import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const events = [
  {
    id: "1",
    name: "Marriage",
    icon: "💒",
    description: "Complete wedding celebration with all traditional ceremonies"
  },
  {
    id: "2", 
    name: "Birthday Party",
    icon: "🎂",
    description: "Memorable birthday celebrations for all ages"
  },
  {
    id: "3",
    name: "Corporate Event", 
    icon: "🏢",
    description: "Professional events, conferences, and company celebrations"
  },
  {
    id: "4",
    name: "Festival Celebration",
    icon: "🎊", 
    description: "Traditional and cultural festival celebrations"
  },
  {
    id: "5",
    name: "Engagement Ceremony",
    icon: "💍",
    description: "Beautiful engagement ceremonies with music and photography"
  }
];

const EventSelection = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
  };

  const handleContinue = () => {
    if (selectedEvent) {
      navigate(`/location-select?eventId=${selectedEvent}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-transparent font-sans">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              What type of event are you planning?
            </h1>
            <p className="text-xl text-muted-foreground">
              Select your event type to see all the artists you'll need
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {events.map((event) => (
              <Card 
                key={event.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedEvent === event.id 
                    ? 'border-2 border-purple-500 shadow-lg' 
                    : 'border hover:border-purple-300'
                }`}
                onClick={() => handleEventSelect(event.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-5xl mb-4">{event.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedEvent && (
            <div className="text-center">
              <Button 
                size="lg" 
                onClick={handleContinue}
                className="px-12"
              >
                Continue to Location Selection
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventSelection;