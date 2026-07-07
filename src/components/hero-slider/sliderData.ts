export type HeroSlide = {
  id: number;
  image: string;
  heading: string;
  subheading: string;
  eyebrow: string;
  objectPosition: string;
  panelAlign: "left" | "right";
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    image: "/assets/hero-slider/mykalakar-platform-montage.jpeg",
    heading: "India's No. 1 Artist Platform",
    subheading:
      "Discover the ultimate digital stage uniting musicians, dancers, painters, and creators under one vibrant roof on MyKalakar.",
    eyebrow: "MyKalakar Spotlight",
    objectPosition: "center center",
    panelAlign: "right",
  },
  {
    id: 2,
    image: "/assets/hero-slider/mykalakar-folk-revival.jpeg",
    heading: "Electrifying Folk Revivals",
    subheading:
      "Feel the authentic heartbeat of regional traditions and energetic live folk performances that bring our roots to the modern stage.",
    eyebrow: "Live Folk Energy",
    objectPosition: "center center",
    panelAlign: "left",
  },
  {
    id: 3,
    image: "/assets/hero-slider/mykalakar-classical-melodies.jpeg",
    heading: "Divine Classical Melodies",
    subheading:
      "Immerse yourself in the soulful depth of classical Indian music, where voice and traditional instruments blend in perfect harmony.",
    eyebrow: "Classical Excellence",
    objectPosition: "center center",
    panelAlign: "right",
  },
  {
    id: 4,
    image: "/assets/hero-slider/mykalakar-heritage-strings.jpeg",
    heading: "Echoes of Heritage",
    subheading:
      "Preserving the legacy of ancient strings, traditional ragas, and sacred acoustic artistry passed down through generations.",
    eyebrow: "Acoustic Legacy",
    objectPosition: "center center",
    panelAlign: "left",
  },
  {
    id: 5,
    image: "/assets/hero-slider/mykalakar-earth-rhythms.jpeg",
    heading: "Rhythms of the Earth",
    subheading:
      "Celebrate the raw, unyielding spirit of cultural processions, vibrant dhol beats, and the joyous energy of the artistic community.",
    eyebrow: "Cultural Processions",
    objectPosition: "center center",
    panelAlign: "right",
  },
];

export const HERO_SLIDE_INTERVAL_MS = 2800;

