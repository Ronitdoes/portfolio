// The Work gallery renders each project once in this order.

export type Project = {
  title: string;
  category: string;
  year: string;
  image: string;
  alt: string;
  href: string;
};

export const projects: Project[] = [
  {
    title: "FinPoint",
    category: "Revenue Recovery Platform",
    year: "2026",
    image: "/projects/finpoint.jpg",
    alt: "Candlestick chart glowing on a dark trading screen",
    href: "https://github.com/Ronitdoes/FinPoint",
  },
  {
    title: "The Date Crew",
    category: "AI Matchmaking Dashboard",
    year: "2026",
    image: "/projects/date-crew.jpg",
    alt: "Wedding couple holding a bouquet in warm evening light",
    href: "https://github.com/Ronitdoes/the-date-crew",
  },
  {
    title: "ColdCraft",
    category: "AI Cold-Email Platform",
    year: "2026",
    image: "/projects/coldcraft.jpg",
    alt: "Frost patterns spreading across a cold window",
    href: "https://usecoldcraft.in",
  },
  {
    title: "Golf Charity",
    category: "Subscription & Charity Platform",
    year: "2026",
    image: "/projects/golf-charity.jpg",
    alt: "Golfer swinging on a bright green course",
    href: "https://golf-blue.vercel.app",
  },
  {
    title: "Oracle Automation",
    category: "Course Automation Toolkit",
    year: "2026",
    image: "/projects/oracle-automation.jpg",
    alt: "Network cables illuminated inside a dark server rack",
    href: "https://github.com/Ronitdoes/oracle-course-automation",
  },
  {
    title: "fk-codetantra",
    category: "AI Study Overlay",
    year: "2026",
    image: "/projects/fk-codetantra.jpg",
    alt: "Close-up of code on a dark monitor",
    href: "https://github.com/Ronitdoes/fk-codetantra",
  },
];
