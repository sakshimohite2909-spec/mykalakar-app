export const initialCategories = [
    {
        name: "Music Artists",
        icon: "🎵",
        subcategories: ["Singers", "Classical Singer", "Playback Singer", "Folk Singer", "Bhajan Singer", "Ghazal Singer", "Devotional Singer", "Rap Singer", "Band Singer", "Instrument Artists", "Guitarist", "Pianist", "Violinist", "Flute Player", "Tabla Player", "Harmonium Player", "Mridangam Player", "Dhol Player", "Drum Artist", "Saxophone Player"],
        subcategoryTypes: {
            "Singers": ["Solo Singer", "Duet Singer", "Group Singer"],
            "Classical Singer": ["Hindustani Classical", "Carnatic Classical", "Semi-Classical", "Light Classical"],
            "Playback Singer": ["Bollywood Playback", "Regional Playback", "Jingle Singer"],
            "Folk Singer": ["Lavani Singer", "Powada Singer", "Gondhal Singer", "Bhilau Singer"],
            "Bhajan Singer": ["Morning Bhajan", "Evening Bhajan", "Kirtan Bhajan", "Devotional Bhajan"],
            "Ghazal Singer": ["Classical Ghazal", "Modern Ghazal", "Sufi Ghazal"],
            "Guitarist": ["Acoustic Guitar", "Electric Guitar", "Bass Guitar", "Classical Guitar"],
            "Pianist": ["Classical Piano", "Jazz Piano", "Pop Piano"],
            "Tabla Player": ["Solo Tabla", "Accompanist Tabla", "Fusion Tabla"],
        },
        count: 0
    },
    {
        name: "Spiritual / Religious",
        icon: "🕉️",
        subcategories: ["Kirtan & Bhakti", "Kirtankar", "Pravachankar", "Bhajan Mandali", "Haripath Mandali", "Warkari Kirtankar", "Varkari Dindi Group", "Gondhal Artist", "Jagran Artist", "Temple / Ritual", "Pujari", "Vedic Chanter", "Bhajan Group", "Devotional Story Teller"],
        subcategoryTypes: {
            "Kirtankar": ["Varkari Kirtan", "Naradiya Kirtan", "Ramayan Kirtan", "Bhagwat Kirtan", "Shiv Kirtan", "Isckon Kirtan", "Sant Charitra Kirtan", "Rashtriya Kirtan", "Bal Kirtan", "Mahila Kirtan", "Samaj Kirtan"],
            "Pravachankar": ["Bhagwat Pravachan", "Ramayan Pravachan", "Dnyaneshwari Pravachan", "Tukaram Gatha Pravachan", "Shiv Puran Pravachan", "Devi Bhagwat Pravachan"],
            "Bhajan Mandali": ["Bhajan Mandali Group", "Kirtan Mandali", "Abhangi Mandali"],
            "Haripath Mandali": ["Haripath Group", "Dindi Group"],
            "Warkari Kirtankar": ["Varkari Kirtan", "Abhang Kirtan", "Palkhi Kirtan"],
            "Jagran Artist": ["Mata Jagran", "Shiv Jagran", "Hanuman Jagran", "Durga Jagran"],
            "Gondhal Artist": ["Traditional Gondhal", "Modern Gondhal"],
            "Pujari": ["Vedic Pujari", "Temple Pujari", "Griha Pravesh Pujari", "Wedding Pujari"],
            "Vedic Chanter": ["Vedic Mantra Chanting", "Stotra Pathan", "Rudra Abhishek"],
            "Devotional Story Teller": ["Katha Vachak", "Harikatha", "Puranic Stories"],
        },
        count: 0
    },
    {
        name: "Dance Artists",
        icon: "💃",
        subcategories: ["Classical Dance", "Bharatanatyam", "Kathak", "Odissi", "Kuchipudi", "Mohiniyattam", "Modern Dance", "Hip Hop", "Bollywood Dance", "Freestyle Dance", "Contemporary Dance", "Folk Dance", "Lavani", "Bhangra", "Garba", "Dandiya", "Koli Dance"],
        subcategoryTypes: {
            "Bharatanatyam": ["Solo Bharatanatyam", "Group Bharatanatyam", "Margam Performance"],
            "Kathak": ["Lucknow Gharana", "Jaipur Gharana", "Benaras Gharana"],
            "Hip Hop": ["Breaking", "Popping", "Locking", "Krumping", "Freestyle"],
            "Bollywood Dance": ["Solo Bollywood", "Group Bollywood", "Couple Dance", "Sangeet Choreography"],
            "Folk Dance": ["Lavani", "Koli Dance", "Dhangari Dance", "Tamasha Dance"],
            "Lavani": ["Traditional Lavani", "Filmi Lavani", "Stage Lavani"],
            "Garba": ["Traditional Garba", "Dandiya Raas", "Modern Garba"],
        },
        count: 0
    },
    {
        name: "Visual Artists",
        icon: "🎨",
        subcategories: ["Painter", "Sketch Artist", "Portrait Artist", "Digital Artist", "Cartoon Artist", "Tattoo Artist", "Graffiti Artist"],
        subcategoryTypes: {
            "Painter": ["Oil Painting", "Watercolor", "Acrylic Painting", "Warli Art", "Madhubani Art"],
            "Sketch Artist": ["Pencil Sketch", "Charcoal Sketch", "Portrait Sketch", "Live Sketch"],
            "Digital Artist": ["Digital Illustration", "3D Art", "Motion Graphics", "NFT Art"],
            "Tattoo Artist": ["Permanent Tattoo", "Temporary Tattoo", "Mehndi Style Tattoo"],
        },
        count: 0
    },
    {
        name: "Stage & Entertainment",
        icon: "🎭",
        subcategories: ["Magician", "Stand-up Comedian", "Mimicry Artist", "Anchor / Host", "DJ", "Beatboxer"],
        subcategoryTypes: {
            "Magician": ["Close-up Magic", "Stage Magic", "Street Magic", "Mentalism", "Kids Magic Show"],
            "Stand-up Comedian": ["Hindi Stand-up", "Marathi Stand-up", "English Stand-up", "Corporate Comedy"],
            "Anchor / Host": ["Wedding Anchor", "Corporate MC", "Event Host", "Award Show Anchor"],
            "DJ": ["Bollywood DJ", "EDM DJ", "Techno DJ", "Wedding DJ", "Club DJ"],
        },
        count: 0
    },
    {
        name: "Traditional Maharashtra",
        icon: "🚩",
        subcategories: ["Gondhal Artist", "Vasudev", "Potraj", "Jogwa Singer", "Bharud Artist", "Powada Singer"],
        subcategoryTypes: {
            "Gondhal Artist": ["Traditional Gondhal", "Modern Gondhal", "Wedding Gondhal"],
            "Powada Singer": ["Historical Powada", "Social Powada", "Shivaji Maharaj Powada"],
            "Bharud Artist": ["Traditional Bharud", "Social Bharud"],
        },
        count: 0
    },
    {
        name: "Cultural Artists",
        icon: "🏺",
        subcategories: ["Lavani Performer", "Tamasha Artist", "Folk Theatre Artist", "Street Performer", "Puppet Artist"],
        subcategoryTypes: {
            "Lavani Performer": ["Traditional Lavani", "Filmi Lavani", "Stage Lavani"],
            "Tamasha Artist": ["Traditional Tamasha", "Modern Tamasha", "Vag Natya"],
            "Puppet Artist": ["String Puppet", "Rod Puppet", "Shadow Puppet"],
        },
        count: 0
    },
    {
        name: "Event Artists",
        icon: "🎉",
        subcategories: ["Wedding Singer", "Wedding Band", "Dhol Tasha Pathak", "Orchestra Group", "Light Music Band"],
        subcategoryTypes: {
            "Wedding Singer": ["Sangeet Singer", "Mehendi Singer", "Reception Singer"],
            "Wedding Band": ["Brass Band", "Pipe Band", "Modern Band"],
            "Dhol Tasha Pathak": ["Traditional Pathak", "Modern Fusion Pathak", "Competition Pathak"],
            "Orchestra Group": ["Bollywood Orchestra", "Classical Orchestra", "Fusion Orchestra"],
        },
        count: 0
    },
    {
        name: "Acting & Media",
        icon: "🎬",
        subcategories: ["Film Actor", "Theatre Actor", "Voice Actor", "Model", "Child Artist"],
        subcategoryTypes: {
            "Film Actor": ["Feature Film", "Short Film", "Ad Film", "Web Series"],
            "Theatre Actor": ["Marathi Natak", "Hindi Theatre", "Street Play", "Musical Drama"],
            "Voice Actor": ["Dubbing Artist", "Voice Over", "Audio Book Narrator"],
            "Model": ["Fashion Model", "Commercial Model", "Ramp Model", "Print Model"],
        },
        count: 0
    },
    {
        name: "Creative Artists",
        icon: "📸",
        subcategories: ["Photographer", "Videographer", "Calligraphy Artist", "Mehndi Artist", "Rangoli Artist", "Sculptor"],
        subcategoryTypes: {
            "Photographer": ["Wedding Photographer", "Portrait Photographer", "Fashion Photographer", "Product Photographer", "Event Photographer"],
            "Videographer": ["Wedding Videographer", "Documentary", "Music Video", "Corporate Video"],
            "Mehndi Artist": ["Bridal Mehndi", "Arabic Mehndi", "Indo-Arabic Mehndi", "Glitter Mehndi"],
            "Rangoli Artist": ["Traditional Rangoli", "Competition Rangoli", "Event Rangoli", "3D Rangoli"],
        },
        count: 0
    }
];

export const initialArtists = [
    {
        name: "Rahul Sharma",
        category: "Music Artists",
        subcategory: "Classical Singer",
        state: "Maharashtra",
        district: "Mumbai",
        bio: "Professional classical singer with 10 years of experience performing at various prestigious events across India.",
        contactNumber: "+91 98765 43210",
        experience: 10,
        services: ["Live Concert", "Wedding Ceremony", "Corporate Event"],
        profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
        availability: "available",
        rating: 4.8,
        reviews: 24,
        verified: true,
        trending: true
    },
    {
        name: "Priya Patil",
        category: "Dance Artists",
        subcategory: "Kathak",
        state: "Maharashtra",
        district: "Pune",
        bio: "Exquisite Kathak dancer performing for over 8 years. Specialized in Jaipuri and Lucknawi gharanas.",
        contactNumber: "+91 98765 12345",
        experience: 8,
        services: ["Stage Performance", "Cultural Workshop"],
        profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
        availability: "available",
        rating: 4.9,
        reviews: 18,
        verified: true,
        trending: false
    },
    {
        name: "Amit Deshmukh",
        category: "Stage & Entertainment",
        subcategory: "Anchor/MC",
        state: "Maharashtra",
        district: "Nagpur",
        bio: "Engaging and energetic MC with a knack for keeping the audience entertained. 5+ years of experience in corporate and social events.",
        contactNumber: "+91 91234 56789",
        experience: 5,
        services: ["Event Hosting", "Corporate MC", "Wedding Anchor"],
        profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
        availability: "available",
        rating: 4.7,
        reviews: 12,
        verified: false,
        trending: true
    }
];
