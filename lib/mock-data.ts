import type {
  Incident,
  InventoryItem,
  Ngo,
  PodLogEntry,
  RawMessage,
  Region,
  Volunteer,
} from './types';

export const PAKISTAN_REGIONS: Region[] = [
  {
    name: 'Sindh',
    districts: ['Dadu', 'Khairpur', 'Larkana', 'Thatta', 'Badin', 'Sukkur'],
  },
  {
    name: 'Punjab',
    districts: ['Rajanpur', 'Muzaffargarh', 'Rahim Yar Khan', 'Layyah', 'Dera Ghazi Khan'],
  },
  {
    name: 'Balochistan',
    districts: ['Quetta', 'Jaffarabad', 'Naseerabad', 'Sibi'],
  },
  {
    name: 'KPK',
    districts: ['Charsadda', 'Nowshera', 'Swat', 'Dera Ismail Khan', 'Mardan'],
  },
];

export const SEED_NGOS: Ngo[] = [
  { id: 'ngo-edhi', name: 'Edhi Foundation', baseCity: 'Karachi', contactPhone: '021-111-334486', lat: 24.8607, lng: 67.0011 },
  { id: 'ngo-alkhidmat', name: 'Al-Khidmat Foundation', baseCity: 'Lahore', contactPhone: '042-111-111-143', lat: 31.5204, lng: 74.3587 },
  { id: 'ngo-jdc', name: 'JDC Foundation', baseCity: 'Karachi', contactPhone: '021-111-523-523', lat: 24.8615, lng: 67.0068 },
  { id: 'ngo-saylani', name: 'Saylani Welfare', baseCity: 'Karachi', contactPhone: '021-111-729-526', lat: 24.8650, lng: 67.0270 },
  { id: 'ngo-pafa', name: 'Pakistan Army Relief', baseCity: 'Multan', contactPhone: '061-555-0100', lat: 30.1575, lng: 71.5249 },
];

export const SEED_VOLUNTEERS: Volunteer[] = [
  { id: 'vol-1', name: 'Bilal Ahmed', phone: '0300-1234567', ngoId: 'ngo-edhi', ngoName: 'Edhi Foundation', baseCity: 'Karachi', skills: ['Rescue', 'Medical'], status: 'Available', lat: 24.8620, lng: 67.0050 },
  { id: 'vol-2', name: 'Fatima Khan', phone: '0321-7654321', ngoId: 'ngo-alkhidmat', ngoName: 'Al-Khidmat Foundation', baseCity: 'Lahore', skills: ['Food', 'Shelter'], status: 'Available', lat: 31.5210, lng: 74.3590 },
  { id: 'vol-3', name: 'Usman Tariq', phone: '0333-9988776', ngoId: 'ngo-edhi', ngoName: 'Edhi Foundation', baseCity: 'Karachi', skills: ['Water', 'Medical'], status: 'Available', lat: 24.8615, lng: 67.0040 },
  { id: 'vol-4', name: 'Ayesha Malik', phone: '0345-5566778', ngoId: 'ngo-saylani', ngoName: 'Saylani Welfare', baseCity: 'Karachi', skills: ['Food', 'Water'], status: 'Available', lat: 24.8640, lng: 67.0260 },
  { id: 'vol-5', name: 'Hamza Sheikh', phone: '0301-2233445', ngoId: 'ngo-pafa', ngoName: 'Pakistan Army Relief', baseCity: 'Multan', skills: ['Rescue', 'Shelter'], status: 'Available', lat: 30.1580, lng: 71.5250 },
  { id: 'vol-6', name: 'Sana Iqbal', phone: '0312-8899001', ngoId: 'ngo-alkhidmat', ngoName: 'Al-Khidmat Foundation', baseCity: 'Lahore', skills: ['Medical', 'Food'], status: 'Available', lat: 31.5205, lng: 74.3588 },
];

export const SEED_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'First Aid Kit', category: 'Medical', quantity: 12, unit: 'kits', ngoId: 'ngo-edhi', locationCity: 'Karachi' },
  { id: 'inv-2', name: 'Dry Ration Pack (5 families)', category: 'Food', quantity: 30, unit: 'packs', ngoId: 'ngo-alkhidmat', locationCity: 'Lahore' },
  { id: 'inv-3', name: 'Water Purification Tablets', category: 'Water', quantity: 200, unit: 'boxes', ngoId: 'ngo-edhi', locationCity: 'Karachi' },
  { id: 'inv-4', name: 'Life Jackets', category: 'Rescue', quantity: 8, unit: 'units', ngoId: 'ngo-pafa', locationCity: 'Multan' },
  { id: 'inv-5', name: 'Tents (4-person)', category: 'Shelter', quantity: 15, unit: 'tents', ngoId: 'ngo-saylani', locationCity: 'Karachi' },
  { id: 'inv-6', name: 'Bottled Water Crates', category: 'Water', quantity: 40, unit: 'crates', ngoId: 'ngo-saylani', locationCity: 'Karachi' },
  { id: 'inv-7', name: 'Ready-to-Eat Meals', category: 'Food', quantity: 250, unit: 'meals', ngoId: 'ngo-jdc', locationCity: 'Karachi' },
  { id: 'inv-8', name: 'Inflatable Rescue Boat', category: 'Rescue', quantity: 3, unit: 'boats', ngoId: 'ngo-pafa', locationCity: 'Multan' },
  { id: 'inv-9', name: 'Medical Supply Box (IV, bandages)', category: 'Medical', quantity: 6, unit: 'boxes', ngoId: 'ngo-alkhidmat', locationCity: 'Lahore' },
  { id: 'inv-10', name: 'Blankets', category: 'Shelter', quantity: 50, unit: 'units', ngoId: 'ngo-edhi', locationCity: 'Karachi' },
];

export const SEED_RAW_MESSAGES: RawMessage[] = [
  {
    id: 'msg-1',
    channel: 'WhatsApp',
    senderName: 'Unknown +92 300 1122334',
    senderContact: '0300-1122334',
    text: 'bhai shadman town me pani gharo me ghus gaya hai 4 log phanse hain khana chahiye jaldi',
    timestamp: Date.now() - 1000 * 60 * 8,
    lang: 'Roman-Urdu',
  },
  {
    id: 'msg-2',
    channel: 'Voice Note',
    senderName: 'Unknown +92 321 4455667',
    senderContact: '0321-4455667',
    text: '[Transcript] paani kaafi tez hai, shadman block B allied bank ke paas, 5 6 ghar doobe hue hain, rescue boat bhejein',
    timestamp: Date.now() - 1000 * 60 * 6,
    lang: 'Roman-Urdu',
  },
  {
    id: 'msg-3',
    channel: 'WhatsApp',
    senderName: 'Unknown +92 333 7788990',
    senderContact: '0333-7788990',
    text: 'shadman town B block allied bank ke qareeb pani andar hai log upar chale gaye hain khana aur paani dono chahiye',
    timestamp: Date.now() - 1000 * 60 * 3,
    lang: 'Roman-Urdu',
  },
  {
    id: 'msg-4',
    channel: 'SMS',
    senderName: 'Unknown +92 345 1212343',
    senderContact: '0345-1212343',
    text: 'Dadu district me gaaon paani me doob gaya 30 se zyada log shift hue hain tent aur ration zaroori hai',
    timestamp: Date.now() - 1000 * 60 * 12,
    lang: 'Roman-Urdu',
  },
  {
    id: 'msg-5',
    channel: 'WhatsApp',
    senderName: 'Unknown +92 301 9988770',
    senderContact: '0301-9988770',
    text: 'rajanpur mein flood aaya hai, medical team chahiye, ek bache ko chot lagi hai, UC wali jagah pe log ikatthe hain',
    timestamp: Date.now() - 1000 * 60 * 15,
    lang: 'Roman-Urdu',
  },
];

export const SEED_INCIDENTS: Incident[] = [
  {
    id: 'inc-seed-1',
    masterId: null,
    status: 'Active Rescue',
    severity: 'Critical',
    extraction: {
      needType: 'Shelter',
      needDetail: '30+ people displaced, need tents and dry rations',
      city: 'Dadu',
      district: 'Dadu',
      sector: 'Dadu District Rural',
      landmark: 'Dadu District villages',
      affectedPeople: 30,
      urgency: 'Critical',
      translatedSummary: 'Villages in Dadu district flooded; 30+ people displaced, needing tents and rations.',
      lat: 26.7306,
      lng: 67.7821,
    },
    sources: [
      {
        messageId: 'msg-4',
        senderName: 'Unknown +92 345 1212343',
        channel: 'SMS',
        originalText: 'Dadu district me gaaon paani me doob gaya 30 se zyada log shift hue hain tent aur ration zaroori hai',
        timestamp: Date.now() - 1000 * 60 * 12,
      },
    ],
    confirmationCount: 1,
    routing: {
      ngoId: 'ngo-saylani',
      ngoName: 'Saylani Welfare',
      distanceKm: 4.2,
      volunteerName: 'Ayesha Malik',
      matchedSupplies: [
        { id: 'inv-5', name: 'Tents (4-person)', category: 'Shelter', quantity: 15, unit: 'tents', ngoId: 'ngo-saylani', locationCity: 'Karachi' },
        { id: 'inv-7', name: 'Ready-to-Eat Meals', category: 'Food', quantity: 250, unit: 'meals', ngoId: 'ngo-jdc', locationCity: 'Karachi' },
      ],
      etaMinutes: 55,
      notes: 'Nearest shelter-capable NGO. Dispatch via Karachi hub.',
    },
    assignedVolunteerId: 'vol-4',
    podLog: [],
    photoUrl: null,
    createdAt: Date.now() - 1000 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 5,
    resolvedAt: null,
  },
  {
    id: 'inc-seed-2',
    masterId: null,
    status: 'Active Rescue',
    severity: 'High',
    extraction: {
      needType: 'Medical',
      needDetail: 'Child injured, needs medical team',
      city: 'Rajanpur',
      district: 'Rajanpur',
      sector: 'UC Wali Jagah',
      landmark: 'Union Council gathering point, Rajanpur',
      affectedPeople: 12,
      urgency: 'High',
      translatedSummary: 'Flood hit Rajanpur; child injured, medical team required at UC gathering point.',
      lat: 29.5432,
      lng: 70.3306,
    },
    sources: [
      {
        messageId: 'msg-5',
        senderName: 'Unknown +92 301 9988770',
        channel: 'WhatsApp',
        originalText: 'rajanpur mein flood aaya hai, medical team chahiye, ek bache ko chot lagi hai, UC wali jagah pe log ikatthe hain',
        timestamp: Date.now() - 1000 * 60 * 15,
      },
    ],
    confirmationCount: 1,
    routing: {
      ngoId: 'ngo-alkhidmat',
      ngoName: 'Al-Khidmat Foundation',
      distanceKm: 3.1,
      volunteerName: 'Sana Iqbal',
      matchedSupplies: [
        { id: 'inv-9', name: 'Medical Supply Box (IV, bandages)', category: 'Medical', quantity: 6, unit: 'boxes', ngoId: 'ngo-alkhidmat', locationCity: 'Lahore' },
      ],
      etaMinutes: 40,
      notes: 'Medical-skilled volunteer available. Dispatch via Lahore hub.',
    },
    assignedVolunteerId: 'vol-6',
    podLog: [],
    photoUrl: null,
    createdAt: Date.now() - 1000 * 60 * 15,
    updatedAt: Date.now() - 1000 * 60 * 7,
    resolvedAt: null,
  },
];

export const SEED_POD_LOGS: PodLogEntry[] = [];

export const SAMPLE_INCOMING_MESSAGES: Omit<RawMessage, 'id' | 'timestamp'>[] = [
  {
    channel: 'WhatsApp',
    senderName: 'Unknown +92 311 4455669',
    senderContact: '0311-4455669',
    text: 'khairpur me school ka roof gir gaya paani ki waja se 10 bache aur 2 ustaaniya phanse hain rescue k patch ka intezar',
    lang: 'Roman-Urdu',
  },
  {
    channel: 'Voice Note',
    senderName: 'Unknown +92 321 7766554',
    senderContact: '0321-7766554',
    text: '[Transcript] nowshera mein paani kashtiyon se aa raha hai, charsaada by-pass waale area mein 25 ghar doob gaye, khana aur paani ki bohot zaroorat',
    lang: 'Roman-Urdu',
  },
  {
    channel: 'WhatsApp',
    senderName: 'Unknown +92 333 2233445',
    senderContact: '0333-2233445',
    text: 'larkana ke qadeem moohre ke paas paani sar par hai, 3 boodhay log hain medical aur rescue dono chahiye, edhi ko batao',
    lang: 'Roman-Urdu',
  },
  {
    channel: 'SMS',
    senderName: 'Unknown +92 345 6655447',
    senderContact: '0345-6655447',
    text: 'thatta ke coastal area me aam log aate hue paani me phanse hain, 15 se 20 families hain shelter aur water chahiye',
    lang: 'Roman-Urdu',
  },
  {
    channel: 'WhatsApp',
    senderName: 'Unknown +92 301 1212345',
    senderContact: '0301-1212345',
    text: 'multan ke shujabad area me paani banki todi, 40 ghar paani me hain, rescue boat aur life jackets bhejein jaldi se',
    lang: 'Roman-Urdu',
  },
  {
    channel: 'Voice Note',
    senderName: 'Unknown +92 322 8899002',
    senderContact: '0322-8899002',
    text: '[Transcript] muzaffargarh mein taunsa Barrage ke qareeb paani tez hai, 8 aurat bacha raat guzar rahe hain ban ke neeche, subah ko rescue possible hai',
    lang: 'Roman-Urdu',
  },
  {
    channel: 'WhatsApp',
    senderName: 'Unknown +92 333 6677889',
    senderContact: '0333-6677889',
    text: 'sukkur ke pat colony me paani gharo me 2 feet hai, 6 ghar affect hue, ration distribution ki zaroorat',
    lang: 'Roman-Urdu',
  },
  {
    channel: 'WhatsApp',
    senderName: 'Unknown +92 301 5544332',
    senderContact: '0301-5544332',
    text: 'shadman town block B allied bank ke paas pani abhi tak hai, 4 aur log phanse hain, boat bhejein please jaldi',
    lang: 'Roman-Urdu',
  },
];
