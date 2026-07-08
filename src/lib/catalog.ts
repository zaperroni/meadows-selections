import type { LucideIcon } from "lucide-react";
import {
  Layers,
  Square,
  Grid3x3,
  Droplet,
  Columns2,
  PaintBucket,
  Triangle,
  DoorOpen,
  Warehouse,
  Blinds,
  AppWindow,
  MoveVertical,
  PanelTop,
  Sun,
  Cpu,
  Hammer,
} from "lucide-react";

export const INK = "#262420";
export const PAPER = "#E9E3D4";
export const CARD = "#FAF8F1";
export const LINE = "#CDC3AA";
export const PINE = "#1F1D1A";
export const PINE_DARK = "#121110";
export const BRASS = "#A2793F";
export const MUTED = "#7A7362";

export const display = "'Fraunces', Georgia, serif";
export const body = "'IBM Plex Sans', system-ui, sans-serif";
export const mono = "'IBM Plex Mono', monospace";

export const fmt = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;

export interface CategoryOption {
  id: string;
  name: string;
  desc: string;
  included: boolean;
  upgradeCost?: number;
  priceTBD?: boolean;
  swatch: string;
}

export interface Category {
  id: string;
  name: string;
  room: string;
  icon: LucideIcon;
  note: string;
  optional?: boolean;
  options: CategoryOption[];
  floors?: undefined;
  items?: undefined;
}

export interface FloorOption {
  id: string;
  name: string;
  desc: string;
  included: boolean;
  upgradeCost?: number;
}

export interface FloorGroup {
  id: string;
  name: string;
  options: FloorOption[];
}

export interface UpgradeItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  unit?: string;
}

export interface FloorsUpgradeGroup {
  id: string;
  name: string;
  room: string;
  icon: LucideIcon;
  note: string;
  floors: FloorGroup[];
  options?: undefined;
  items?: undefined;
  type?: undefined;
  optional?: undefined;
}

export interface ItemsUpgradeGroup {
  id: string;
  name: string;
  room: string;
  icon: LucideIcon;
  note: string;
  type: "single" | "multi";
  items: UpgradeItem[];
  options?: undefined;
  floors?: undefined;
  optional?: undefined;
}

export type UpgradeGroup = FloorsUpgradeGroup | ItemsUpgradeGroup;
export type ActiveEntity = Category | UpgradeGroup;

export const CATEGORIES: Category[] = [
  {
    id: "roof",
    name: "Roof Color",
    room: "Exterior",
    icon: Triangle,
    note: "GAF Timberline architectural shingle, standard manufacturer warranty.",
    options: [
      {
        id: "charcoal",
        name: "Charcoal",
        desc: "GAF Timberline — deep charcoal blend.",
        included: true,
        swatch: "linear-gradient(135deg, #3E3C3A 0%, #262422 100%)",
      },
      {
        id: "pewter-grey",
        name: "Pewter Grey",
        desc: "GAF Timberline — cool pewter grey blend.",
        included: true,
        swatch: "linear-gradient(135deg, #7A8188 0%, #5C636A 100%)",
      },
      {
        id: "weathered-wood",
        name: "Weathered Wood",
        desc: "GAF Timberline — warm brown-grey blend.",
        included: true,
        swatch: "repeating-linear-gradient(115deg, #786655 0px, #8A7863 6px, #6E5C4B 12px)",
      },
      {
        id: "other-timberline",
        name: "Other GAF Timberline Colors",
        desc: "Any additional color from the GAF Timberline lineup, special order.",
        included: false,
        upgradeCost: 400,
        swatch: "repeating-linear-gradient(115deg, #4A4038 0px, #6B5C4E 8px, #8A7863 16px)",
      },
    ],
  },
  {
    id: "siding-front",
    name: "Siding (Front Fascia)",
    room: "Exterior",
    icon: Columns2,
    note: "Hardieplank Cedarmill fiber cement siding on the front of the house. Any color from the James Hardie Statement Collection is included.",
    options: [
      { id: "arctic-white", name: "Arctic White", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #F3F1EA 0%, #E6E2D6 100%)" },
      { id: "navajo-beige", name: "Navajo Beige", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #D8C9A3 0%, #C4B48C 100%)" },
      { id: "monterey-taupe", name: "Monterey Taupe", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #A79378 0%, #8D7A60 100%)" },
      { id: "khaki-brown", name: "Khaki Brown", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #8B7355 0%, #6E5A42 100%)" },
      { id: "timber-bark", name: "Timber Bark", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #6B5744 0%, #4E3F31 100%)" },
      { id: "rich-espresso", name: "Rich Espresso", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #4A3728 0%, #33241A 100%)" },
      { id: "cobble-stone", name: "Cobble Stone", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #B8AF9E 0%, #9F9683 100%)" },
      { id: "pearl-gray", name: "Pearl Gray", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #C7C7C2 0%, #ABABA5 100%)" },
      { id: "aged-pewter", name: "Aged Pewter", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #7D7568 0%, #63594C 100%)" },
      { id: "night-gray", name: "Night Gray", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #3A3A3A 0%, #232323 100%)" },
      { id: "iron-gray", name: "Iron Gray", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #52514C 0%, #383733 100%)" },
      { id: "mountain-sage", name: "Mountain Sage", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #8A9478 0%, #707A5E 100%)" },
      { id: "light-mist", name: "Light Mist", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #D6D9D2 0%, #C0C4BA 100%)" },
      { id: "gray-slate", name: "Gray Slate", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #6E7370 0%, #545A56 100%)" },
      { id: "boothbay-blue", name: "Boothbay Blue", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #4C6270 0%, #354A57 100%)" },
      { id: "evening-blue", name: "Evening Blue", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #2E3D4A 0%, #1D2933 100%)" },
      { id: "deep-ocean", name: "Deep Ocean", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #1F2E38 0%, #131E26 100%)" },
      { id: "countrylane-red", name: "Countrylane Red", desc: "Statement Collection", included: true, swatch: "linear-gradient(135deg, #7A2C25 0%, #5C1F19 100%)" },
    ],
  },
  {
    id: "siding-sides-rear",
    name: "Siding (Sides & Rear)",
    room: "Exterior",
    icon: Columns2,
    note: "Alside vinyl siding on the sides and rear of the house.",
    options: [
      { id: "glacier-white", name: "Glacier White", desc: "Alside Vinyl", included: true, swatch: "linear-gradient(135deg, #F2F0EA 0%, #E4E1D7 100%)" },
      { id: "monterey-sand", name: "Monterey Sand", desc: "Alside Vinyl", included: true, swatch: "linear-gradient(135deg, #D9C9A8 0%, #C3B08C 100%)" },
      { id: "adobe-cream", name: "Adobe Cream", desc: "Alside Vinyl", included: true, swatch: "linear-gradient(135deg, #E8DCC0 0%, #D6C8A5 100%)" },
      { id: "antique-parchment", name: "Antique Parchment", desc: "Alside Vinyl", included: true, swatch: "linear-gradient(135deg, #DCD0B0 0%, #C7B993 100%)" },
      { id: "tuscan-clay", name: "Tuscan Clay", desc: "Alside Vinyl", included: true, swatch: "linear-gradient(135deg, #C08552 0%, #A26B3D 100%)" },
      {
        id: "other-alside",
        name: "Other Alside Vinyl Colors",
        desc: "Any Alside vinyl color not listed above.",
        included: false,
        upgradeCost: 350,
        swatch: "repeating-linear-gradient(90deg, #8C8272 0px, #8C8272 14px, #766C5D 14px, #766C5D 18px)",
      },
      {
        id: "hardieplank-all-sides",
        name: "Hardieplank on All Sides",
        desc: "Upgrade sides and rear from Alside vinyl to James Hardie fiber cement siding, matching the front.",
        included: false,
        upgradeCost: 55000,
        swatch: "repeating-linear-gradient(90deg, #DAD5C6 0px, #DAD5C6 20px, #C7C2B0 20px, #C7C2B0 22px)",
      },
    ],
  },
  {
    id: "shutters",
    name: "Shutters",
    room: "Exterior",
    icon: Blinds,
    optional: true,
    note: "Mid America raised-panel vinyl shutters, or none. Skip for a clean, shutter-free elevation.",
    options: [
      { id: "no-shutters", name: "No Shutters", desc: "No shutters installed.", included: true, swatch: "linear-gradient(135deg, #EDE9DE 0%, #DED8C8 100%)" },
      { id: "shutter-black", name: "Black", desc: "Mid America Raised Panel Vinyl", included: true, swatch: "linear-gradient(135deg, #2B2B2B 0%, #141414 100%)" },
      { id: "shutter-midnight-blue", name: "Midnight Blue", desc: "Mid America Raised Panel Vinyl", included: true, swatch: "linear-gradient(135deg, #23324A 0%, #141D2C 100%)" },
      { id: "shutter-forest-green", name: "Forest Green", desc: "Mid America Raised Panel Vinyl", included: true, swatch: "linear-gradient(135deg, #2F4A32 0%, #1D2F1F 100%)" },
    ],
  },
  {
    id: "windows",
    name: "Windows",
    room: "Exterior",
    icon: AppWindow,
    note: "Alside Vinyl Double Hung windows throughout.",
    options: [
      { id: "white-white", name: "White / White", desc: "Alside Vinyl Double Hung — white exterior, white interior.", included: true, swatch: "linear-gradient(135deg, #F4F2EC 0%, #E7E3D6 100%)" },
      {
        id: "black-white",
        name: "Black Exterior / White Interior",
        desc: "Alside Vinyl Double Hung — black exterior, white interior.",
        included: false,
        upgradeCost: 850,
        swatch: "linear-gradient(135deg, #2B2B2B 0%, #F4F2EC 100%)",
      },
    ],
  },
  {
    id: "front-door",
    name: "Front Door Color",
    room: "Exterior",
    icon: DoorOpen,
    note: "Standard fiberglass front door, builder finish color.",
    options: [
      {
        id: "white",
        name: "White",
        desc: "Standard satin white finish.",
        included: true,
        swatch: "linear-gradient(135deg, #F4F2EC 0%, #E7E3D6 100%)",
      },
      {
        id: "builder-black",
        name: "Black",
        desc: "Satin black finish.",
        included: false,
        upgradeCost: 100,
        swatch: "linear-gradient(135deg, #2B2B2B 0%, #141414 100%)",
      },
      {
        id: "iron-ore",
        name: "Iron Ore",
        desc: "Deep warm grey finish.",
        included: false,
        upgradeCost: 100,
        swatch: "linear-gradient(135deg, #4E4A46 0%, #34302C 100%)",
      },
      {
        id: "barn-red",
        name: "Designer Red",
        desc: "Classic barn-red painted finish.",
        included: false,
        upgradeCost: 100,
        swatch: "linear-gradient(135deg, #8C2E22 0%, #6B2119 100%)",
      },
      {
        id: "natural-stain",
        name: "Natural Stain Finish",
        desc: "Upgraded wood-grain fiberglass, stained finish.",
        included: false,
        upgradeCost: 250,
        swatch: "repeating-linear-gradient(100deg, #6B4A34 0px, #7C5940 6px, #5C3F2C 12px)",
      },
    ],
  },
  {
    id: "garage-door",
    name: "Garage Door Style",
    room: "Exterior",
    icon: Warehouse,
    note: "Garage door(s), standard builder finish.",
    options: [
      {
        id: "clopay-9130",
        name: "Clopay Raised Short Panel #9130",
        desc: "Standard metal raised short panel door.",
        included: true,
        swatch: "linear-gradient(135deg, #EDEAE0 0%, #DAD5C6 100%)",
      },
      {
        id: "black-doors",
        name: "Black Doors",
        desc: "Standard door style, black finish.",
        included: false,
        upgradeCost: 300,
        swatch: "linear-gradient(135deg, #2B2B2B 0%, #141414 100%)",
      },
      {
        id: "coachman-doors",
        name: "Coachman Doors",
        desc: "Clopay Coachman collection, carriage-house style with decorative hardware.",
        included: false,
        upgradeCost: 1200,
        swatch: "repeating-linear-gradient(90deg, #8C8272 0px, #8C8272 16px, #766C5D 16px, #766C5D 20px)",
      },
    ],
  },
  {
    id: "cabinets",
    name: "Kitchen Cabinets",
    room: "Kitchen",
    icon: Layers,
    note: "All kitchen cabinetry, soft-close hardware, one finish color.",
    options: [
      {
        id: "shaker-white",
        name: "Shaker — Alabaster White",
        desc: "Painted maple shaker door, brushed nickel pulls.",
        included: true,
        swatch: "linear-gradient(135deg, #F4F1E8 0%, #E7E2D2 100%)",
      },
      {
        id: "shaker-greige",
        name: "Shaker — Greige",
        desc: "Painted maple shaker door, matte black pulls.",
        included: false,
        upgradeCost: 400,
        swatch: "linear-gradient(135deg, #C9C2B0 0%, #A9A08A 100%)",
      },
      {
        id: "slab-walnut",
        name: "Slab — Natural Walnut",
        desc: "Walnut veneer flat-panel door, integrated pull.",
        included: false,
        upgradeCost: 1700,
        swatch: "repeating-linear-gradient(100deg, #6B4A34 0px, #7C5940 6px, #5C3F2C 12px)",
      },
    ],
  },
  {
    id: "countertops",
    name: "Countertops",
    room: "Kitchen",
    icon: Square,
    note: "Kitchen island, perimeter, and standard edge profile.",
    options: [
      {
        id: "white-quartz",
        name: "White Quartz",
        desc: "From builder's selection, eased edge.",
        included: true,
        swatch: "linear-gradient(120deg, #F7F5EF 0%, #EDEAE0 40%, #DAD5C6 55%, #F2EFE6 100%)",
      },
      {
        id: "granite-uba-tuba",
        name: "Granite — Uba Tuba",
        desc: "Natural granite, dark green-black with gold flecks, bullnose edge.",
        included: true,
        swatch: "radial-gradient(circle at 30% 30%, #4A5045 0%, #2A2E26 55%, #14150F 100%)",
      },
      {
        id: "granite-wheat",
        name: "Granite — Wheat",
        desc: "Natural granite, warm golden-tan speckled finish, bullnose edge.",
        included: true,
        swatch: "radial-gradient(circle at 30% 30%, #C9A96E 0%, #A98C54 55%, #8C7142 100%)",
      },
      {
        id: "other-tbd",
        name: "Other — Price TBD",
        desc: "Any countertop material not listed above. Price to be determined based on the customer's selection.",
        included: false,
        priceTBD: true,
        swatch: "repeating-linear-gradient(90deg, #8C8272 0px, #8C8272 14px, #766C5D 14px, #766C5D 18px)",
      },
    ],
  },
  {
    id: "flooring",
    name: "Flooring",
    room: "Main Living Areas",
    icon: Grid3x3,
    note: "Entry, kitchen, and great room. Bedrooms carpeted separately.",
    options: [
      {
        id: "red-oak-natural",
        name: "#1 Common Red Oak — Natural",
        desc: "3/4\" x 2-1/4\" strip flooring, 2 coats polyurethane finish.",
        included: true,
        swatch: "repeating-linear-gradient(90deg, #C9A876 0px, #D8BC8E 10px, #BF9C6C 20px)",
      },
      {
        id: "flooring-stain",
        name: "Flooring Stain",
        desc: "#1 Common Red Oak with a stain color added, 2 coats polyurethane finish.",
        included: false,
        upgradeCost: 500,
        swatch: "repeating-linear-gradient(90deg, #6B4A34 0px, #7C5940 10px, #5C3F2C 20px)",
      },
    ],
  },
  {
    id: "plumbing",
    name: "Plumbing Fixtures",
    room: "Kitchen & Baths",
    icon: Droplet,
    note: "All faucets, shower trim, and cabinet hardware finish.",
    options: [
      {
        id: "matte-black",
        name: "Matte Black Package",
        desc: "Matte black faucets, shower trim, and hardware.",
        included: true,
        swatch: "linear-gradient(135deg, #2B2B2B 0%, #141414 100%)",
      },
      {
        id: "polished-nickel",
        name: "Polished Nickel Package",
        desc: "Polished nickel faucets and trim.",
        included: false,
        upgradeCost: 200,
        swatch: "linear-gradient(135deg, #E4E4E4 0%, #B9BABC 100%)",
      },
      {
        id: "brushed-brass",
        name: "Brushed Brass Package",
        desc: "Warm brushed brass faucets and trim.",
        included: false,
        upgradeCost: 450,
        swatch: "linear-gradient(135deg, #D9BE97 0%, #B8935A 100%)",
      },
    ],
  },
  {
    id: "paint",
    name: "Paint & Trim",
    room: "Whole Home",
    icon: PaintBucket,
    note: "Interior walls and trim, one palette selection.",
    options: [
      {
        id: "builder-palette",
        name: "Builder Palette — Warm Neutral",
        desc: "One wall color, white trim, standard sheen.",
        included: true,
        swatch: "linear-gradient(135deg, #EDE7D9 0%, #E3DCC8 100%)",
      },
      {
        id: "designer-palette",
        name: "Designer Palette — Custom",
        desc: "Two wall colors + accent, designer consult included.",
        included: false,
        upgradeCost: 400,
        swatch: "linear-gradient(135deg, #7C8A6E 0%, #7C8A6E 50%, #EDE7D9 50%, #EDE7D9 100%)",
      },
    ],
  },
];

export const CEILING_HEIGHT_OPTIONS: FloorOption[] = [
  { id: "8ft", name: "8'", desc: "Standard ceiling height.", included: true },
  { id: "9ft", name: "9'", desc: "Upgrade ceiling height to 9'.", included: false, upgradeCost: 19850 },
  { id: "10ft", name: "10'", desc: "Upgrade ceiling height to 10'.", included: false, upgradeCost: 38500 },
];

export const UPGRADE_GROUPS: UpgradeGroup[] = [
  {
    id: "ceiling-height",
    name: "Ceiling Height",
    room: "Home Upgrades — Structural",
    icon: MoveVertical,
    note: "Choose a ceiling height for each floor independently — mix and match as needed. Standard is 8'.",
    floors: [
      { id: "basement", name: "Basement", options: CEILING_HEIGHT_OPTIONS },
      { id: "first-floor", name: "First Floor", options: CEILING_HEIGHT_OPTIONS },
      { id: "second-floor", name: "Second Floor", options: CEILING_HEIGHT_OPTIONS },
    ],
  },
  {
    id: "ceiling-features",
    name: "Ceiling Features",
    room: "Home Upgrades — Structural",
    icon: PanelTop,
    type: "multi",
    note: "Priced per room. Select any that apply.",
    items: [
      {
        id: "coffered",
        name: "Coffered Ceiling",
        desc: "Recessed grid-panel ceiling detail.",
        price: 6500,
        unit: "per room",
      },
      {
        id: "tray",
        name: "Tray Ceiling with Light Rail",
        desc: "Stepped ceiling detail with integrated light rail.",
        price: 9900,
        unit: "per room",
      },
    ],
  },
  {
    id: "covered-deck",
    name: "Covered Deck",
    room: "Home Upgrades — Outdoor Living",
    icon: Sun,
    type: "single",
    note: "Select one, or keep the standard deck.",
    items: [
      {
        id: "deck-1",
        name: "Covered Deck — Option 1",
        desc: "Increase deck size to 18'×20', add roof over deck, composite railings, cedar decking.",
        price: 90000,
      },
      {
        id: "deck-2",
        name: "Covered Deck — Option 2",
        desc: "Everything in Option 1, plus exterior grill, countertop prep station, exterior propane fireplace, and ceiling fan.",
        price: 110000,
      },
    ],
  },
  {
    id: "technology",
    name: "Technology & Smart Home",
    room: "Home Upgrades — Technology",
    icon: Cpu,
    type: "multi",
    note: "Select any that apply.",
    items: [
      {
        id: "sonos",
        name: "Sonos Sound Package",
        desc: "4 ceiling speakers, wired to a Sonos Amp.",
        price: 15000,
      },
      {
        id: "tech-package",
        name: "Technology Package",
        desc: "Upgrade 6 switches to Lutron Smart Lighting and 2 thermostats to Smart Thermostats.",
        price: 5000,
      },
      {
        id: "security",
        name: "Home Security Package",
        desc: "4 Ring Spotlight Cameras, hardwired alarm system.",
        price: 25000,
      },
      {
        id: "ev-charger",
        name: "EV Charging Station",
        desc: "Dedicated electric vehicle charging station in the garage.",
        price: 7500,
      },
      {
        id: "generator",
        name: "22kW Generac Generator",
        desc: "Whole-home standby generator.",
        price: 16500,
      },
    ],
  },
  {
    id: "future-planning",
    name: "Future Planning",
    room: "Home Upgrades — Future Planning",
    icon: Hammer,
    type: "multi",
    note: "Select any that apply.",
    items: [
      {
        id: "basement-prep",
        name: "Prep for Future Finished Basement",
        desc: "1 egress window in basement, rough plumbing for a 2-fixture bathroom.",
        price: 7500,
      },
    ],
  },
];
