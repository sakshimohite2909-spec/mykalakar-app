import React from 'react';
import { Share2, Bookmark } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

// Dummy data for the template
const sections = [
  {
    id: 'birthday-wishes',
    title: 'Birthday Wishes',
    description: 'Celebrating the special days of our wonderful students and staff.',
    cards: [
      { id: 1, title: 'Happy Birthday Rahul!', image: 'https://images.unsplash.com/photo-1530143311094-34d807799e8f?auto=format&fit=crop&q=80&w=400', date: 'Today' },
      { id: 2, title: 'Happy Birthday Priya!', image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&q=80&w=400', date: 'Tomorrow' },
      { id: 3, title: 'Happy Birthday Amit Sir!', image: 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&q=80&w=400', date: 'Next Week' },
    ]
  },
  {
    id: 'admission-welcome',
    title: 'Admission Welcome',
    description: 'Welcoming our new bright minds to the school family.',
    cards: [
      { id: 4, title: 'Welcome Class of 2024!', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=400', date: 'New Batch' },
      { id: 5, title: 'Orientation Day Highlights', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400', date: 'Last Week' },
      { id: 6, title: 'A Message from Principal', image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=400', date: 'Featured' },
    ]
  },
  {
    id: 'sports-day',
    title: 'Sports Day',
    description: 'Fostering teamwork, discipline, and physical fitness.',
    cards: [
      { id: 7, title: 'Annual Athletics Meet', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=400', date: 'Upcoming' },
      { id: 8, title: 'Inter-School Basketball Finals', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400', date: 'Gold Medalists' },
      { id: 9, title: 'Swimming Gala 2024', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&q=80&w=400', date: 'Highlights' },
    ]
  },
  {
    id: 'cultural-activities',
    title: 'Cultural Activities',
    description: 'Nurturing creativity and cultural values in our students.',
    cards: [
      { id: 10, title: 'Diwali Celebration', image: 'https://images.unsplash.com/photo-1514222709107-a180c68d72b4?auto=format&fit=crop&q=80&w=400', date: 'Festivals' },
      { id: 11, title: 'Art & Craft Exhibition', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=400', date: 'Exhibition' },
      { id: 12, title: 'Folk Dance Competition', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400', date: 'Winners' },
    ]
  },
  {
    id: 'annual-function',
    title: 'Annual Function',
    description: 'The biggest celebration of the year showcasing student talent.',
    cards: [
      { id: 13, title: 'Annual Drama Play', image: 'https://images.unsplash.com/photo-1507676184212-766b1a9952a2?auto=format&fit=crop&q=80&w=400', date: 'Performance' },
      { id: 14, title: 'Choir Group Song', image: 'https://images.unsplash.com/photo-1503933156686-3532c589cbdb?auto=format&fit=crop&q=80&w=400', date: 'Music' },
      { id: 15, title: 'Awards Distribution Ceremony', image: 'https://images.unsplash.com/photo-1517260739337-6799d239ce83?auto=format&fit=crop&q=80&w=400', date: 'Honors' },
    ]
  },
  {
    id: 'results-achievements',
    title: 'Results & Achievements',
    description: 'Celebrating the academic excellence and extraordinary achievements.',
    cards: [
      { id: 16, title: 'Class 10th Board Toppers', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400', date: 'Academics' },
      { id: 17, title: 'National Science Olympiad', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400', date: 'Gold Medal' },
      { id: 18, title: 'Debate Competition Winners', image: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=400', date: 'First Prize' },
    ]
  }
];

export const SchoolTemplate = () => {
  const handleShare = (title: string) => {
    // WhatsApp sharing URL scheme
    const text = encodeURIComponent(`Check this out: ${title} - Shared from our School Website!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSave = (title: string) => {
    // Placeholder for save functionality
    alert(`Saved "${title}" to your bookmarks!`);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            School Highlights & Updates
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Stay connected with the latest news, events, and achievements of our students.
          </p>
        </div>

        {sections.map((section) => (
          <section key={section.id} className="scroll-mt-24" id={section.id}>
            <div className="mb-8 border-b pb-4">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{section.title}</h2>
              <p className="text-gray-500 mt-2">{section.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.cards.map((card) => (
                <Card key={card.id} className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-white border-0 shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={card.image} 
                      alt={card.title} 
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                      {card.date}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl line-clamp-2 leading-tight">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      Click to read more about this amazing update from our {section.title.toLowerCase()} section.
                    </p>
                  </CardContent>

                  <CardFooter className="pt-2 pb-5 flex justify-between items-center border-t border-gray-50 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShare(card.title)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 gap-2 font-medium"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSave(card.title)} 
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 font-medium"
                    >
                      <Bookmark className="w-4 h-4" />
                      Save
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SchoolTemplate;
