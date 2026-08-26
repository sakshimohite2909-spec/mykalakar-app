const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'locales', 'en', 'common.json');
const mrPath = path.join(__dirname, '..', 'src', 'locales', 'mr', 'common.json');
const hiPath = path.join(__dirname, '..', 'src', 'locales', 'hi', 'common.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));

const newTranslations = {
  // Categories
  "category.varkariSampraday": {
    en: "Varkari Sampraday",
    mr: "वारकरी संप्रदाय",
    hi: "वारकरी संप्रदाय"
  },
  "category.wedding": {
    en: "Wedding",
    mr: "लग्न समारंभ",
    hi: "विवाह समारोह"
  },
  "category.performers": {
    en: "Performers",
    mr: "सादरीकरण कलाकार",
    hi: "कलाकार"
  },
  "category.eventServices": {
    en: "Event Services",
    mr: "इव्हेंट सेवा",
    hi: "इवेंट सेवाएं"
  },
  "category.folkTraditionalArts": {
    en: "Folk & Traditional Arts",
    mr: "लोककला व पारंपरिक कला",
    hi: "लोक कला एवं पारंपरिक कला"
  },
  "category.birthday": {
    en: "Birthday",
    mr: "वाढदिवस",
    hi: "जन्मदिन"
  },
  "category.corporateEvent": {
    en: "Corporate Event",
    mr: "कॉर्पोरेट इव्हेंट",
    hi: "कॉर्पोरेट इवेंट"
  },
  "category.culturalEvent": {
    en: "Cultural Event",
    mr: "सांस्कृतिक कार्यक्रम",
    hi: "सांस्कृतिक कार्यक्रम"
  },
  "category.religiousEvent": {
    en: "Religious Event",
    mr: "धार्मिक कार्यक्रम",
    hi: "धार्मिक कार्यक्रम"
  },
  "category.collegeEvent": {
    en: "College Event",
    mr: "कॉलेज / युथ फेस्टिव्हल",
    hi: "कॉलेज इवेंट"
  },
  "category.festivalEvent": {
    en: "Festival Event",
    mr: "उत्सव व सण",
    hi: "त्योहार एवं उत्सव"
  },
  "category.otherEvents": {
    en: "Other Events",
    mr: "इतर कार्यक्रम",
    hi: "अन्य कार्यक्रम"
  },

  // Groups
  "group.spiritualSpeakers": {
    en: "Spiritual Speakers",
    mr: "प्रबोधनकार व वक्ते",
    hi: "आध्यात्मिक वक्ता"
  },
  "group.vocalArtists": {
    en: "Vocal Artists",
    mr: "गायक व भजन मंडळ",
    hi: "गायक एवं भजन मंडली"
  },
  "group.instrumentalArtists": {
    en: "Instrumental Artists",
    mr: "वाद्यवृंद व साथीदार",
    hi: "संगीत वाद्य कलाकार"
  },
  "group.organizations": {
    en: "Organizations",
    mr: "संस्था व मंडळे",
    hi: "संस्थाएं एवं मंडल"
  },
  "group.venues": {
    en: "Venues",
    mr: "हॉल व जागा",
    hi: "सभागृह एवं स्थल"
  },
  "group.bridalGroomServices": {
    en: "Bridal & Groom Services",
    mr: "वधू-वर शृंगार व सेवा",
    hi: "दूल्हा-दुल्हन सेवाएं"
  },
  "group.photographyVideography": {
    en: "Photography & Videography",
    mr: "फोटोग्राफी व व्हिडिओग्राफी",
    hi: "फोटोग्राफी एवं वीडियोग्राफी"
  },
  "group.entertainment": {
    en: "Entertainment",
    mr: "मनोरंजन",
    hi: "मनोरंजन"
  },
  "group.catering": {
    en: "Catering",
    mr: "कॅटरिंग व भोजन व्यवस्था",
    hi: "कैटरिंग सेवाएं"
  },
  "group.decoration": {
    en: "Decoration",
    mr: "डेकोरेशन व मांडणी",
    hi: "सजावट एवं डेकोरेशन"
  },

  // Art Labels
  "artLabel.kirtankar": {
    en: "Kirtankar",
    mr: "कीर्तनकार",
    hi: "कीर्तनकार"
  },
  "artLabel.pravachankar": {
    en: "Pravachankar",
    mr: "प्रवचनकार",
    hi: "प्रवचनकार"
  },
  "artLabel.vyaspeethChalak": {
    en: "Vyaspithchalak",
    mr: "व्यासपीठ चालक",
    hi: "व्यासपीठ चालक"
  },
  "artLabel.chopdar": {
    en: "Chopdar",
    mr: "चोपदार",
    hi: "चोपदार"
  },
  "artLabel.bhagwatKatha": {
    en: "Bhagwat Katha",
    mr: "भागवत कथा",
    hi: "भागवत कथा"
  },
  "artLabel.ramKatha": {
    en: "Ram Katha",
    mr: "राम कथा",
    hi: "राम कथा"
  },
  "artLabel.gayak": {
    en: "Singer / Gayak",
    mr: "गायक",
    hi: "गायक"
  },
  "artLabel.bharudkar": {
    en: "Bharudkar",
    mr: "भारुडकार",
    hi: "भारुड़कार"
  },
  "artLabel.bhajaniMandal": {
    en: "Bhajani Mandal",
    mr: "भजनी मंडळ",
    hi: "भजनी मंडल"
  },
  "artLabel.shastriyaBhajan": {
    en: "Classical Bhajan",
    mr: "शास्त्रीय भजन",
    hi: "शास्त्रीय भजन"
  },
  "artLabel.mrudungmani": {
    en: "Mridangamani",
    mr: "मृदंगमणी",
    hi: "मृदंगवादक"
  },
  "artLabel.veenekari": {
    en: "Vinekari",
    mr: "वीणेकरी",
    hi: "वीणेकरी"
  },
  "artLabel.taalKari": {
    en: "Talkari",
    mr: "टाळकरी",
    hi: "तालकारी"
  },
  "artLabel.chiplyaPlayer": {
    en: "Chiplya Player",
    mr: "चिपळ्या वादक",
    hi: "चिपल्या वादक"
  },
  "artLabel.tablaVadak": {
    en: "Tabla Vadak",
    mr: "तबला वादक",
    hi: "तबला वादक"
  },
  "artLabel.harmoniumVadak": {
    en: "Harmonium Vadak",
    mr: "हार्मोनियम वादक",
    hi: "हारमोनियम वादक"
  },
  "artLabel.dholkiVadak": {
    en: "Dholki Vadak",
    mr: "ढोलकी वादक",
    hi: "ढोलकी वादक"
  },
  "artLabel.varkariSanstha": {
    en: "Varkari Sanstha",
    mr: "वारकरी संस्था",
    hi: "वारकरी संस्था"
  },
  "artLabel.dholPathak": {
    en: "Dhol-Tasha Pathak",
    mr: "ढोल-ताशा पथक",
    hi: "ढोल-ताशा पथक"
  },
  "artLabel.zanjPathak": {
    en: "Zanj Pathak",
    mr: "झांज पथक",
    hi: "झांझ पथक"
  },
  "artLabel.lezimPathak": {
    en: "Lezim Pathak",
    mr: "लेझिम पथक",
    hi: "लेजिम पथक"
  },
  "artLabel.gondhal": {
    en: "Gondhal",
    mr: "गोंधळ",
    hi: "गोंधल"
  },
  "artLabel.jagran": {
    en: "Jagran Gondhal",
    mr: "जागरण गोंधळ",
    hi: "जागरण गोंधल"
  },
  "artLabel.bharud": {
    en: "Bharud",
    mr: "भारुड",
    hi: "भारुड़"
  },
  "artLabel.shahiriPowada": {
    en: "Shahiri & Powada",
    mr: "शाहिरी व पोवाडा",
    hi: "शाहिरी एवं पोवाड़ा"
  },
  "artLabel.lavani": {
    en: "Lavani",
    mr: "लावणी",
    hi: "लावणी"
  },
  "artLabel.waghyaMurali": {
    en: "Waghya Murali",
    mr: "वाघ्या मुरळी",
    hi: "वाघ्या मुरली"
  },
  "artLabel.jalsaDashavatar": {
    en: "Jalsa & Dashavatar",
    mr: "जलसा व दशावतार",
    hi: "जलसा एवं दशावतार"
  },
  "artLabel.dhagaaiDholki": {
    en: "Dhagaai & Dholki",
    mr: "ढगाळ व ढोलकी",
    hi: "ढोलकी वादन"
  },
  "artLabel.bahurupiya": {
    en: "Bahurupiya",
    mr: "बहुरूपी",
    hi: "बहुरूपिया"
  },
  "artLabel.vasudev": {
    en: "Vasudev",
    mr: "वासुदेव",
    hi: "वासुदेव"
  },
  "artLabel.tutariVadak": {
    en: "Tutari Vadak",
    mr: "तुतारी वादक",
    hi: "तुतारी वादक"
  },
  "artLabel.shehnaiVadak": {
    en: "Shehnai Vadak",
    mr: "शहनाई वादक",
    hi: "शहनाई वादक"
  },
  "artLabel.halgiVadak": {
    en: "Halgi Vadak",
    mr: "हलगी वादक",
    hi: "हलगी वादक"
  },
  "artLabel.sambalVadak": {
    en: "Sambal Vadak",
    mr: "संबळ वादक",
    hi: "संबल वादक"
  },
  "artLabel.liveSinger": {
    en: "Live Singer",
    mr: "लाईव्ह गायक",
    hi: "लाइव गायक"
  },
  "artLabel.weddingBand": {
    en: "Wedding Band",
    mr: "बँड पथक",
    hi: "बैंड बाजा"
  },
  "artLabel.liveBands": {
    en: "Live Bands",
    mr: "लाईव्ह बँड्स",
    hi: "लाइव बैंड"
  },
  "artLabel.celebrityArtist": {
    en: "Celebrity Artist",
    mr: "सेलिब्रिटी कलाकार",
    hi: "सेलिब्रिटी कलाकार"
  },
  "artLabel.danceGroups": {
    en: "Dance Groups",
    mr: "नृत्य समूह",
    hi: "नृत्य समूह"
  },
  "artLabel.choreographer": {
    en: "Choreographer",
    mr: "नृत्य दिग्दर्शक (कोरियोग्राफर)",
    hi: "कोरियोग्राफर"
  },
  "artLabel.mimicryArtist": {
    en: "Mimicry Artist",
    mr: "मिमिक्री कलाकार",
    hi: "मिमिक्री कलाकार"
  },
  "artLabel.clownsMascot": {
    en: "Clowns / Mascot",
    mr: "जोकर व मॅस्कॉट",
    hi: "जोकर एवं मैस्कॉट"
  },
  "artLabel.keynoteSpeaker": {
    en: "Keynote Speaker",
    mr: "प्रमुख वक्ते",
    hi: "मुख्य वक्ता"
  },
  "artLabel.weddingPhotographer": {
    en: "Wedding Photographer",
    mr: "वेडिंग फोटोग्राफर",
    hi: "वेडिंग फोटोग्राफर"
  },
  "artLabel.candidPhotographer": {
    en: "Candid Photographer",
    mr: "कॅंडिड फोटोग्राफर",
    hi: "कैंडिड फोटोग्राफर"
  },
  "artLabel.traditionalPhotographer": {
    en: "Traditional Photographer",
    mr: "पारंपरिक फोटोग्राफर",
    hi: "पारंपरिक फोटोग्राफर"
  },
  "artLabel.weddingVideographer": {
    en: "Wedding Videographer",
    mr: "वेडिंग व्हिडिओग्राफर",
    hi: "वेडिंग वीडियोग्राफर"
  },
  "artLabel.cinematicVideographer": {
    en: "Cinematic Videographer",
    mr: "सिनेमॅटिक व्हिडिओग्राफर",
    hi: "सिनेमैटिक वीडियोग्राफर"
  },
  "artLabel.dronePhotography": {
    en: "Drone Photography",
    mr: "ड्रोन फोटोग्राफी",
    hi: "ड्रोन फोटोग्राफी"
  },
  "artLabel.preWeddingShoot": {
    en: "Pre-Wedding Shoot",
    mr: "प्री-वेडिंग शूट",
    hi: "प्री-वेडिंग शूट"
  },
  "artLabel.liveStreaming": {
    en: "Live Streaming",
    mr: "लाईव्ह स्ट्रिमिंग",
    hi: "लाइव स्ट्रीमिंग"
  },
  "artLabel.photoBooth": {
    en: "Photo Booth",
    mr: "फोटो बूथ",
    hi: "फोटो बूथ"
  },
  "artLabel.corporatePhotographer": {
    en: "Corporate Photographer",
    mr: "कॉर्पोरेट फोटोग्राफर",
    hi: "कॉर्पोरेट फोटोग्राफर"
  },
  "artLabel.bridalMakeup": {
    en: "Bridal Makeup Artist",
    mr: "ब्रायडल मेकअप आर्टिस्ट",
    hi: "ब्राइडल मेकअप आर्टिस्ट"
  },
  "artLabel.groomMakeup": {
    en: "Groom Makeup Artist",
    mr: "ग्रूम मेकअप आर्टिस्ट",
    hi: "दूल्हा मेकअप आर्टिस्ट"
  },
  "artLabel.hairstylist": {
    en: "Hairstylist",
    mr: "केशभूषाकार (हेअरस्टायलिस्ट)",
    hi: "हेयर स्टाइलिस्ट"
  },
  "artLabel.nailArtist": {
    en: "Nail Artist",
    mr: "नेल आर्टिस्ट",
    hi: "नेल आर्टिस्ट"
  },
  "artLabel.sareeDraping": {
    en: "Saree Draping",
    mr: "साडी नेसवणे (ड्रेपिंग)",
    hi: "साड़ी ड्रेपिंग"
  },
  "artLabel.personalStylist": {
    en: "Personal Stylist",
    mr: "पर्सनल स्टायलिस्ट",
    hi: "पर्सनल स्टाइलिस्ट"
  },
  "artLabel.stageLighting": {
    en: "Stage & Lighting",
    mr: "स्टेज व लाईटिंग",
    hi: "स्टेज एवं लाइटिंग"
  },
  "artLabel.ledWall": {
    en: "LED Wall Setup",
    mr: "एलईडी वॉल सेटअप",
    hi: "एलईडी स्क्रीन सेटअप"
  },
  "artLabel.balloonDecoration": {
    en: "Balloon Decoration",
    mr: "फुगे डेकोरेशन (बलून)",
    hi: "गुब्बारा सजावट"
  },
  "artLabel.flowerDecoration": {
    en: "Flower Decoration",
    mr: "फुलांचे डेकोरेशन",
    hi: "फूलों की सजावट"
  },
  "artLabel.stageDecoration": {
    en: "Stage Decoration",
    mr: "मंच (स्टेज) सजावट",
    hi: "स्टेज सजावट"
  },
  "artLabel.weddingDecorator": {
    en: "Wedding Decorator",
    mr: "वेडिंग डेकोरेटर",
    hi: "वेडिंग डेकोरेटर"
  },
  "artLabel.vegCatering": {
    en: "Veg Catering",
    mr: "शाकाहारी कॅटरिंग",
    hi: "शाकाहारी कैटरिंग"
  },
  "artLabel.nonVegCatering": {
    en: "Non-Veg Catering",
    mr: "मांसाहारी कॅटरिंग",
    hi: "मांसाहारी कैटरिंग"
  },
  "artLabel.maharashtrianCatering": {
    en: "Maharashtrian Catering",
    mr: "महाराष्ट्रीयन पद्धतीचे जेवण",
    hi: "महाराष्ट्रीयन कैटरिंग"
  },
  "artLabel.banquetHall": {
    en: "Banquet Hall",
    mr: "बँक्वेट हॉल",
    hi: "बैंक्वेट हॉल"
  },
  "artLabel.marriageHall": {
    en: "Marriage Hall",
    mr: "मंगल कार्यालय (हॉल)",
    hi: "विवाह भवन"
  },
  "artLabel.lawn": {
    en: "Lawn / Open Ground",
    mr: "लॉन / मोकळी जागा",
    hi: "लॉन / खुला मैदान"
  },
  "artLabel.resort": {
    en: "Resort",
    mr: "रिसॉर्ट",
    hi: "रिसॉर्ट"
  },
  "artLabel.hotel": {
    en: "Hotel",
    mr: "हॉटेल",
    hi: "होटल"
  },
  "artLabel.panditPriest": {
    en: "Pandit / Priest",
    mr: "भटजी / पंडित",
    hi: "पंडित / पुरोहित"
  },
  "artLabel.poojaPandit": {
    en: "Pooja Pandit",
    mr: "पूजा पंडित",
    hi: "पूजा पंडित"
  },

  // Search & Filters
  "search.selectLocationFor": {
    en: "Select Location for \"{{category}}\"",
    mr: "\"{{category}}\" साठी शहर / ठिकाण निवडा",
    hi: "\"{{category}}\" के लिए स्थान चुनें"
  },
  "search.noResultsFound": {
    en: "No results found",
    mr: "कोणतेही निकाल आढळले नाहीत",
    hi: "कोई परिणाम नहीं मिला"
  },
  "search.allCities": {
    en: "All Cities",
    mr: "सर्व शहरे",
    hi: "सभी शहर"
  },
  "search.searchPlaceholder": {
    en: "Search singer, dhol, city...",
    mr: "गायक, ढोल, शहर शोधा...",
    hi: "गायक, ढोल, शहर खोजें..."
  },
  "search.verifiedOnly": {
    en: "Verified Only",
    mr: "फक्त सत्यापित",
    hi: "केवल सत्यापित"
  },
  "search.clearFilters": {
    en: "Clear Filters",
    mr: "फिल्टर साफ करा",
    hi: "फ़िल्टर हटाएं"
  },
  "search.showingResults": {
    en: "Showing {{count}} results",
    mr: "{{count}} निकाल दाखवत आहे",
    hi: "{{count}} परिणाम प्रदर्शित"
  },

  // Category Page Headings & Empty States
  "category.artistsIn": {
    en: "Artists in {{name}}",
    mr: "{{name}} मधील कलाकार",
    hi: "{{name}} में कलाकार"
  },
  "category.servicesIn": {
    en: "{{name}} Services",
    mr: "{{name}} सेवा",
    hi: "{{name}} सेवाएं"
  },
  "category.organizationsIn": {
    en: "{{name}} Organizations",
    mr: "{{name}} संस्था व मंडळे",
    hi: "{{name}} संस्थाएं"
  },
  "category.availableServices": {
    en: "Available {{name}}",
    mr: "उपलब्ध {{name}}",
    hi: "उपलब्ध {{name}}"
  },
  "category.availableOrganizations": {
    en: "Organizations in {{name}}",
    mr: "{{name}} मधील संस्था",
    hi: "{{name}} में संस्थाएं"
  },
  "category.heroSubtitleArtist": {
    en: "Find and book verified professional artists for your event.",
    mr: "तुमच्या कार्यक्रमासाठी सत्यापित व्यावसायिक कलाकार शोधा आणि बुक करा.",
    hi: "अपने कार्यक्रम के लिए सत्यापित पेशेवर कलाकार खोजें और बुक करें।"
  },
  "category.heroSubtitleService": {
    en: "Find and book verified event service providers and vendors for your event.",
    mr: "तुमच्या कार्यक्रमासाठी सत्यापित सेवा पुरवठादार आणि विक्रेते शोधा आणि बुक करा.",
    hi: "अपने कार्यक्रम के लिए सत्यापित सेवा प्रदाता खोजें और बुक करें।"
  },
  "category.heroSubtitleOrg": {
    en: "Discover registered organizations, troupes, and groups for your event.",
    mr: "तुमच्या कार्यक्रमासाठी नोंदणीकृत संस्था, मंडळे आणि पथके शोधा.",
    hi: "अपने कार्यक्रम के लिए पंजीकृत संस्थाएं और समूह खोजें।"
  },
  "category.noArtistsInCity": {
    en: "No artists available in {{city}}",
    mr: "{{city}} मध्ये कोणतेही कलाकार उपलब्ध नाहीत",
    hi: "{{city}} में कोई कलाकार उपलब्ध नहीं है"
  },
  "category.noServicesInCity": {
    en: "No services available in {{city}}",
    mr: "{{city}} मध्ये कोणत्याही सेवा उपलब्ध नाहीत",
    hi: "{{city}} में कोई सेवा उपलब्ध नहीं है"
  },
  "category.noArtistsAvailable": {
    en: "No {{name}} artists available right now",
    mr: "सध्या कोणतेही {{name}} कलाकार उपलब्ध नाहीत",
    hi: "वर्तमान में कोई {{name}} कलाकार उपलब्ध नहीं है"
  },
  "category.noServicesAvailable": {
    en: "No {{name}} services available right now",
    mr: "सध्या कोणत्याही {{name}} सेवा उपलब्ध नाहीत",
    hi: "वर्तमान में कोई {{name}} सेवा उपलब्ध नहीं है"
  },
  "category.viewAllArtists": {
    en: "View All {{name}} Artists",
    mr: "सर्व {{name}} कलाकार पहा",
    hi: "सभी {{name}} कलाकार देखें"
  },
  "category.viewAllServices": {
    en: "View All {{name}} Services",
    mr: "सर्व {{name}} सेवा पहा",
    hi: "सभी {{name}} सेवाएं देखें"
  },
  "category.viewAllOrgs": {
    en: "View All {{name}} Organizations",
    mr: "सर्व {{name}} संस्था पहा",
    hi: "सभी {{name}} संस्थाएं देखें"
  },
  "category.subcategories": {
    en: "Subcategories",
    mr: "उपप्रकार",
    hi: "उपश्रेणियाँ"
  },
  "category.filterByCity": {
    en: "Filter by City",
    mr: "शहरांनुसार फिल्टर करा",
    hi: "शहर अनुसार फ़िल्टर करें"
  },
  "category.experienceYears": {
    en: "{{years}} Years Experience",
    mr: "{{years}} वर्षे अनुभव",
    hi: "{{years}} वर्ष अनुभव"
  },
  "category.startingFrom": {
    en: "Starting from",
    mr: "सुरुवात ₹",
    hi: "शुरुआती मूल्य ₹"
  },
  "category.verified": {
    en: "Verified",
    mr: "सत्यापित",
    hi: "सत्यापित"
  },
  "category.quickBook": {
    en: "Book Now",
    mr: "आता बुक करा",
    hi: "अभी बुक करें"
  },
  "category.sendInquiry": {
    en: "Send Inquiry",
    mr: "चौकशी पाठवा",
    hi: "पूछताछ भेजें"
  },
  "category.viewProfile": {
    en: "View Profile",
    mr: "प्रोफाइल पहा",
    hi: "प्रोफ़ाइल देखें"
  },

  // Artist Profile
  "artist.about": {
    en: "About Artist",
    mr: "कलाकाराबद्दल माहिती",
    hi: "कलाकार के बारे में"
  },
  "artist.servicesPricing": {
    en: "Services & Pricing",
    mr: "सेवा आणि मानधन",
    hi: "सेवाएं एवं मूल्य"
  },
  "artist.reelsVideos": {
    en: "Reels & Videos",
    mr: "रिल्स आणि व्हिडिओ",
    hi: "रील्स एवं वीडियो"
  },
  "artist.photoGallery": {
    en: "Photo Gallery",
    mr: "फोटो गॅलरी",
    hi: "फ़ोटो गैलरी"
  },
  "artist.reviewsTestimonials": {
    en: "Customer Reviews",
    mr: "ग्राहकांचे अभिप्राय",
    hi: "ग्राहक समीक्षाएं"
  },
  "artist.availabilityCalendar": {
    en: "Availability Calendar",
    mr: "उपलब्धता कॅलेंडर",
    hi: "उपलब्धता कैलेंडर"
  },
  "artist.soloPrice": {
    en: "Solo Performance",
    mr: "एकल सादरीकरण (Solo)",
    hi: "एकल प्रस्तुति"
  },
  "artist.duoPrice": {
    en: "Duo Performance",
    mr: "युगल सादरीकरण (Duo)",
    hi: "युगल प्रस्तुति"
  },
  "artist.teamPrice": {
    en: "Group Performance",
    mr: "समूह सादरीकरण (Group)",
    hi: "समूह प्रस्तुति"
  },
  "artist.contactWhatsApp": {
    en: "WhatsApp",
    mr: "व्हॉट्सअ‍ॅप",
    hi: "व्हाट्सएप"
  },
  "artist.contactCall": {
    en: "Call Now",
    mr: "कॉल करा",
    hi: "कॉल करें"
  },

  // Modals & Requirements
  "modal.postRequirement": {
    en: "Post Event Requirement",
    mr: "कार्यक्रमाची आवश्यकता पोस्ट करा",
    hi: "कार्यक्रम आवश्यकता पोस्ट करें"
  },
  "modal.submitRequirement": {
    en: "Submit Requirement",
    mr: "आवश्यकता सबमिट करा",
    hi: "आवश्यकता सबमिट करें"
  },
  "modal.inquiryTitle": {
    en: "Send Booking Inquiry",
    mr: "बुकिंग चौकशी पाठवा",
    hi: "बुकिंग पूछताछ भेजें"
  },
  "modal.inquiryDesc": {
    en: "Fill in your event details to connect directly with the artist.",
    mr: "कलाकाराशी थेट संपर्क साधण्यासाठी तुमच्या कार्यक्रमाची माहिती भरा.",
    hi: "कलाकार से सीधा संपर्क करने के लिए अपने कार्यक्रम का विवरण भरें।"
  },
  "modal.name": {
    en: "Your Full Name",
    mr: "तुमचे पूर्ण नाव",
    hi: "आपका पूरा नाम"
  },
  "modal.phone": {
    en: "Mobile Phone Number",
    mr: "मोबाईल नंबर",
    hi: "मोबाइल नंबर"
  },
  "modal.eventDate": {
    en: "Event Date",
    mr: "कार्यक्रमाची तारीख",
    hi: "कार्यक्रम की तिथि"
  },
  "modal.location": {
    en: "City / Location",
    mr: "शहर / ठिकाण",
    hi: "शहर / स्थान"
  },
  "modal.message": {
    en: "Additional Message / Special Requirements",
    mr: "अधिक तपशील / विशेष मागण्या",
    hi: "अतिरिक्त विवरण / विशेष मांगें"
  },
  "modal.sendInquiryBtn": {
    en: "Send Inquiry",
    mr: "चौकशी पाठवा",
    hi: "पूछताछ भेजें"
  },
  "modal.cancel": {
    en: "Cancel",
    mr: "रद्द करा",
    hi: "रद्द करें"
  },

  // Validations
  "validation.nameRequired": {
    en: "Name is required",
    mr: "नाव आवश्यक आहे",
    hi: "नाम आवश्यक है"
  },
  "validation.phoneRequired": {
    en: "Valid 10-digit phone number is required",
    mr: "वैध १० अंकी मोबाईल नंबर आवश्यक आहे",
    hi: "मान्य 10-अंकीय मोबाइल नंबर आवश्यक है"
  },
  "validation.cityRequired": {
    en: "Please select a city",
    mr: "कृपया शहर निवडा",
    hi: "कृपया शहर चुनें"
  },
  "validation.dateRequired": {
    en: "Please select an event date",
    mr: "कृपया कार्यक्रमाची तारीख निवडा",
    hi: "कृपया कार्यक्रम की तिथि चुनें"
  },
  "validation.inquirySuccess": {
    en: "Inquiry sent successfully! The artist has been notified.",
    mr: "चौकशी यशस्वीरीत्या पाठवली गेली! कलाकाराला सूचना मिळाली आहे.",
    hi: "पूछताछ सफलतापूर्वक भेजी गई! कलाकार को सूचित कर दिया गया है।"
  },
  "validation.bookingSuccess": {
    en: "Booking requested successfully!",
    mr: "बुकिंग विनंती यशस्वीरीत्या पाठवली गेली!",
    hi: "बुकिंग अनुरोध सफलतापूर्वक भेजा गया!"
  }
};

for (const [key, obj] of Object.entries(newTranslations)) {
  en[key] = obj.en;
  mr[key] = obj.mr;
  hi[key] = obj.hi;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2), 'utf8');
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2), 'utf8');

console.log('Successfully updated en, mr, hi JSON files! Total keys:', Object.keys(en).length);
