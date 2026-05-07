export const initialCategories = [
    {
        id: "general",
        name: "General",
        slug: "general",
        icon: "🎭",
        sortOrder: 1,
        isActive: true,
        subcategories: [
            "Actors",
            "Singer",
            "Karaoke Singers",
            "Orchestra",
            "Magicians",
            "Puppet Show",
            "DJ's",
            "Anchors / Hosts",
            "Motivational Speakers",
            "Photo & Videography",
            "Makeup / Mehndi Artist"
        ],
        subcategoryTypes: {},
        count: 0
    },
    {
        id: "folk_art",
        name: "Folk Art",
        slug: "folk-art",
        icon: "🥁",
        sortOrder: 2,
        isActive: true,
        subcategories: [
            "Gondhal",
            "Jagran",
            "Bharud",
            "Shahir & Powada",
            "Lezim Pathak",
            "Zanz Pathak",
            "Dhol Pathak",
            "Waghya-Murali",
            "Jalsa & Dashavtar",
            "Dhangari & Dhol Ovi",
            "Bahurupiya"
        ],
        subcategoryTypes: {},
        count: 0
    },
    {
        id: "varkari_sampraday",
        name: "Varkari Sampraday",
        slug: "varkari-sampraday",
        icon: "🛕",
        sortOrder: 3,
        isActive: true,
        subcategories: [
            "Kirtankar",
            "Pravachankar",
            "Vyaspethchalak",
            "Chopdar",
            "Gayak",
            "Mrudangmani",
            "Bharudkar",
            "Soundsystem",
            "Mandap & Decoration",
            "Venekari",
            "Taalkari",
            "Varkari Sanstha",
            "Bhajani Mandal",
            "Shastriya Bhajan",
            "Tabla Vadak",
            "Harmonium Vadak",
            "Dholki Vadak"
        ],
        subcategoryTypes: {},
        count: 0
    }
];

export const platformCategories = [
    {
        id: "music_artists",
        name: "Music Artists",
        slug: "music-artists",
        icon: "🎵",
        sortOrder: 1,
        isActive: true,
        subcategories: ["Singer", "Classical Singer", "Karaoke Singers", "Orchestra", "DJ's", "Tabla Player", "Harmonium Player", "Live Band"],
        subcategoryTypes: {},
        count: 0
    },
    {
        id: "dance_artists",
        name: "Dance Artists",
        slug: "dance-artists",
        icon: "💃",
        sortOrder: 2,
        isActive: true,
        subcategories: ["Kathak", "Bharatanatyam", "Lavani", "Folk Dance", "Bollywood Dance", "Choreographer"],
        subcategoryTypes: {},
        count: 0
    },
    {
        id: "stage_entertainment",
        name: "Stage & Entertainment",
        slug: "stage-entertainment",
        icon: "🎭",
        sortOrder: 3,
        isActive: true,
        subcategories: ["Anchor/MC", "Magicians", "Puppet Show", "Stand-up Comedy", "Motivational Speakers"],
        subcategoryTypes: {},
        count: 0
    },
    {
        id: "creative_artists",
        name: "Creative Artists",
        slug: "creative-artists",
        icon: "🎨",
        sortOrder: 4,
        isActive: true,
        subcategories: ["Photo & Videography", "Makeup / Mehndi Artist", "Decor Artist", "Balloon Artist"],
        subcategoryTypes: {},
        count: 0
    },
    {
        id: "folk_art",
        name: "Folk Art",
        slug: "folk-art",
        icon: "🥁",
        sortOrder: 5,
        isActive: true,
        subcategories: ["Gondhal", "Jagran", "Bharud", "Shahir & Powada", "Lezim Pathak", "Zanz Pathak", "Dhol Pathak", "Waghya-Murali", "Jalsa & Dashavtar", "Dhangari & Dhol Ovi", "Bahurupiya"],
        subcategoryTypes: {},
        count: 0
    },
    {
        id: "varkari_sampraday",
        name: "Varkari Sampraday",
        slug: "varkari-sampraday",
        icon: "🛕",
        sortOrder: 6,
        isActive: true,
        subcategories: ["Kirtankar", "Pravachankar", "Vyaspethchalak", "Chopdar", "Gayak", "Mrudangmani", "Bharudkar", "Soundsystem", "Mandap & Decoration", "Venekari", "Taalkari", "Varkari Sanstha", "Bhajani Mandal", "Shastriya Bhajan", "Tabla Vadak", "Harmonium Vadak", "Dholki Vadak"],
        subcategoryTypes: {},
        count: 0
    },
    {
        id: "event_artists",
        name: "Event Artists",
        slug: "event-artists",
        icon: "🎊",
        sortOrder: 7,
        isActive: true,
        subcategories: ["Wedding Artist", "Birthday Party Artist", "Corporate Event Artist", "Festival Artist"],
        subcategoryTypes: {},
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
