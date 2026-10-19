import type { InventoryItem, NeedType, Ngo, StructuredExtraction, Volunteer } from '../types';

/* Lightweight fallback parser used in demo mode or when no Groq key is set.
   It mimics Agent 1's extraction with keyword heuristics tuned for Roman-Urdu. */

const NEED_KEYWORDS: Record<NeedType, string[]> = {
  Food: ['khana', 'ration', 'rashan', 'food', 'meal', 'roti', 'dabba', 'ration'],
  Water: ['paani', 'pani', 'water', 'drink', 'saaf pani', 'purification'],
  Medical: ['medical', 'dawa', 'doctor', 'chot', 'zakhm', 'bimar', 'team', 'hospital', 'injury', 'ill'],
  Rescue: ['rescue', 'phansa', 'phenasa', 'phense', 'boat', 'naiya', 'save', 'patch', 'ghuse', 'duba', 'doob', 'todi', 'barrage'],
  Shelter: ['tent', 'shelter', 'chhat', 'roof', 'raat guzar', 'shift', 'camp', 'blanket', 'kamra'],
};

const CITY_TO_DISTRICT: Record<string, string> = {
  dadu: 'Dadu',
  khairpur: 'Khairpur',
  larkana: 'Larkana',
  thatta: 'Thatta',
  badin: 'Badin',
  sukkur: 'Sukkur',
  rajanpur: 'Rajanpur',
  muzaffargarh: 'Muzaffargarh',
  'rahim yar khan': 'Rahim Yar Khan',
  layyah: 'Layyah',
  'dera ghazi khan': 'Dera Ghazi Khan',
  quetta: 'Quetta',
  jaffarabad: 'Jaffarabad',
  naseerabad: 'Naseerabad',
  sibi: 'Sibi',
  charsadda: 'Charsadda',
  nowshera: 'Nowshera',
  swat: 'Swat',
  'dera ismail khan': 'Dera Ismail Khan',
  mardan: 'Mardan',
  karachi: 'Karachi',
  lahore: 'Lahore',
  multan: 'Multan',
  shujabad: 'Multan',
};

const CITY_TO_REGION: Record<string, string> = {
  dadu: 'Sindh', khairpur: 'Sindh', larkana: 'Sindh', thatta: 'Sindh', badin: 'Sindh', sukkur: 'Sindh', karachi: 'Sindh',
  rajanpur: 'Punjab', muzaffargarh: 'Punjab', 'rahim yar khan': 'Punjab', layyah: 'Punjab', 'dera ghazi khan': 'Punjab', lahore: 'Punjab', multan: 'Punjab', shujabad: 'Punjab',
  quetta: 'Balochistan', jaffarabad: 'Balochistan', naseerabad: 'Balochistan', sibi: 'Balochistan',
  charsadda: 'KPK', nowshera: 'KPK', swat: 'KPK', 'dera ismail khan': 'KPK', mardan: 'KPK',
};

function detectNeed(text: string): NeedType {
  const lower = text.toLowerCase();
  let best: NeedType = 'Rescue';
  let bestScore = 0;
  (Object.keys(NEED_KEYWORDS) as NeedType[]).forEach((need) => {
    const score = NEED_KEYWORDS[need].reduce((s, kw) => (lower.includes(kw) ? s + 1 : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = need;
    }
  });
  return best;
}

function detectLocation(text: string): { city: string; district: string; sector: string; landmark: string } {
  const lower = text.toLowerCase();
  let city = 'Unknown';
  let district = 'Unknown';
  for (const key of Object.keys(CITY_TO_DISTRICT)) {
    if (lower.includes(key)) {
      city = CITY_TO_DISTRICT[key];
      district = CITY_TO_DISTRICT[key];
      break;
    }
  }
  // Sector / landmark heuristics
  const sectorMatch = text.match(/(?:block|town|sector|colony|uc|union council)\s*([A-Z a-z]*)/i);
  const sector = sectorMatch ? sectorMatch[0].trim() : city !== 'Unknown' ? `${city} area` : 'Unspecified area';
  const landmarkMatch = text.match(/(?:near|paas|qareeb|ke paas|ke qareeb)\s+([A-Za-z ]+)/i);
  const landmark = landmarkMatch ? landmarkMatch[1].trim() : sector;
  return { city, district, sector, landmark };
}

function detectPeople(text: string): number {
  const nums = text.match(/\d+/g);
  if (!nums) return 1;
  const parsed = nums.map(Number).filter((n) => n > 0 && n < 5000);
  if (parsed.length === 0) return 1;
  // Prefer larger numbers as affected-people count
  return Math.max(...parsed);
}

function detectUrgency(text: string, people: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  const lower = text.toLowerCase();
  if (lower.includes('jaldi') || lower.includes('please') || lower.includes('urgent') || people >= 20) return 'Critical';
  if (people >= 10) return 'High';
  if (people >= 4) return 'Medium';
  return 'Low';
}

export function fallbackExtract(text: string): StructuredExtraction {
  const needType = detectNeed(text);
  const loc = detectLocation(text);
  const affectedPeople = detectPeople(text);
  const urgency = detectUrgency(text, affectedPeople);
  const needDetail = `${needType} assistance required for ${affectedPeople} affected people near ${loc.landmark}.`;
  return {
    needType,
    needDetail,
    city: loc.city,
    district: loc.district,
    sector: loc.sector,
    landmark: loc.landmark,
    affectedPeople,
    urgency,
    translatedSummary: `Parsed: ${needType} needed at ${loc.city}, ${loc.district} — ${loc.landmark}. ~${affectedPeople} affected.`,
    lat: null,
    lng: null,
  };
}

/* Deduplication heuristic — same landmark (case-insensitive, normalized) within an open ticket window */
export function normalizeLandmark(landmark: string): string {
  return landmark
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+(near|ke paas|ke qareeb|paas|qareeb|block|town)\s+/g, ' ')
    .trim();
}

export function findDuplicateIncidents(
  extraction: StructuredExtraction,
  incidents: { id: string; status: string; extraction: StructuredExtraction }[],
): string[] {
  const targetLandmark = normalizeLandmark(extraction.landmark);
  const targetDistrict = extraction.district.toLowerCase();
  if (!targetLandmark || targetLandmark === 'unspecified area') return [];
  return incidents
    .filter((i) => i.status === 'Active Rescue' || i.status === 'Pending Verification')
    .filter(
      (i) =>
        i.extraction.district.toLowerCase() === targetDistrict &&
        normalizeLandmark(i.extraction.landmark) === targetLandmark,
    )
    .map((i) => i.id);
}

/* Logistics matching heuristic */
export function matchLogistics(
  extraction: StructuredExtraction,
  volunteers: Volunteer[],
  inventory: InventoryItem[],
  ngos: Ngo[],
): { volunteer: Volunteer; ngo: Ngo; supplies: InventoryItem[]; distanceKm: number; etaMinutes: number } | null {
  const city = extraction.city.toLowerCase();
  // Prefer volunteers with matching skill, prefer same base city
  const candidates = volunteers
    .filter((v) => v.skills.includes(extraction.needType) && v.status === 'Available')
    .sort((a, b) => {
      const aMatch = a.baseCity.toLowerCase() === city ? 0 : 1;
      const bMatch = b.baseCity.toLowerCase() === city ? 0 : 1;
      return aMatch - bMatch;
    });
  if (candidates.length === 0) return null;
  const volunteer = candidates[0];
  const ngo = ngos.find((n) => n.id === volunteer.ngoId) ?? ngos[0];
  const supplies = inventory
    .filter((inv) => inv.category === extraction.needType && inv.quantity > 0)
    .slice(0, 3);
  // crude distance estimate based on base city match
  const sameCity = volunteer.baseCity.toLowerCase() === city;
  const distanceKm = sameCity ? +(2 + Math.random() * 2).toFixed(1) : +(8 + Math.random() * 15).toFixed(1);
  const etaMinutes = Math.round(distanceKm * 8 + 15);
  return { volunteer, ngo, supplies, distanceKm, etaMinutes };
}
