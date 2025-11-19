// lib/flags.ts

// Map country names to their ISO 3166-1 alpha-2 codes
const countryCodeMap: { [key: string]: string } = {
  // A
  'afghanistan': 'af', 'albania': 'al', 'algeria': 'dz', 'andorra': 'ad',
  'angola': 'ao', 'argentina': 'ar', 'armenia': 'am', 'australia': 'au', 'aruba': 'aw',
  'austria': 'at', 'azerbaijan': 'az',
  // B
  'bahamas': 'bs', 'bahrain': 'bh', 'bangladesh': 'bd', 'barbados': 'bb',
  'belarus': 'by', 'belgium': 'be', 'belize': 'bz', 'benin': 'bj',
  'bhutan': 'bt', 'bolivia': 'bo', 'bosnia': 'ba', 'botswana': 'bw',
  'brazil': 'br', 'brunei': 'bn', 'bulgaria': 'bg', 'burkina faso': 'bf',
  'burundi': 'bi',
  // C
  'cambodia': 'kh', 'cameroon': 'cm', 'canada': 'ca', 'cape verde': 'cv',
  'chad': 'td', 'chile': 'cl', 'china': 'cn', 'colombia': 'co',
  'comoros': 'km', 'congo': 'cg', 'costa rica': 'cr', 'croatia': 'hr',
  'cuba': 'cu', 'cyprus': 'cy', 'czech republic': 'cz', 'czechia': 'cz',
  // D
  'denmark': 'dk', 'djibouti': 'dj', 'dominica': 'dm', 'dominican republic': 'do',
  // E
  'ecuador': 'ec', 'egypt': 'eg', 'el salvador': 'sv', 'estonia': 'ee', 'eswatini': 'sz',
  'ethiopia': 'et',
  // F
  'fiji': 'fj', 'finland': 'fi', 'france': 'fr',
  // G
  'gabon': 'ga', 'gambia': 'gm', 'georgia': 'ge', 'germany': 'de',
  'ghana': 'gh', 'greece': 'gr', 'grenada': 'gd', 'guatemala': 'gt',
  'guinea': 'gn', 'guyana': 'gy',
  // H
  'haiti': 'ht', 'honduras': 'hn', 'hungary': 'hu', 'hong kong': 'hk',
  // I
  'iceland': 'is', 'isle of man': 'im', 'india': 'in', 'indonesia': 'id', 'iran': 'ir',
  'iraq': 'iq', 'ireland': 'ie', 'israel': 'il', 'italy': 'it',
  // J
  'jamaica': 'jm', 'japan': 'jp', 'jordan': 'jo',
  // K
  'kazakhstan': 'kz', 'kenya': 'ke', 'kuwait': 'kw', 'kyrgyzstan': 'kg',
  // L
  'laos': 'la', 'latvia': 'lv', 'lebanon': 'lb', 'lesotho': 'ls',
  'liberia': 'lr', 'libya': 'ly', 'lithuania': 'lt', 'luxembourg': 'lu',
  // M
  'madagascar': 'mg', 'malawi': 'mw', 'malaysia': 'my', 'maldives': 'mv',
  'mali': 'ml', 'malta': 'mt', 'mauritania': 'mr', 'mauritius': 'mu',
  'mexico': 'mx', 'moldova': 'md', 'monaco': 'mc', 'mongolia': 'mn',
  'montenegro': 'me', 'morocco': 'ma', 'mozambique': 'mz', 'myanmar': 'mm', 'macau': 'mo',
  // N
  'namibia': 'na', 'nepal': 'np', 'netherlands': 'nl',  'new zealand': 'nz',
  'nicaragua': 'ni', 'niger': 'ne', 'nigeria': 'ng', 'north korea': 'kp',
  'north macedonia': 'mk', 'norway': 'no',
  // O
  'oman': 'om',
  // P
  'pakistan': 'pk', 'panama': 'pa', 'paraguay': 'py', 'peru': 'pe',
  'philippines': 'ph', 'poland': 'pl', 'portugal': 'pt',
  // Q
  'qatar': 'qa',
  // R
  'romania': 'ro', 'russia': 'ru', 'rwanda': 'rw',
  // S
  'saudi arabia': 'sa', 'senegal': 'sn', 'serbia': 'rs', 'singapore': 'sg',
  'slovakia': 'sk', 'slovenia': 'si', 'somalia': 'so', 'south africa': 'za',
  'south korea': 'kr', 'south sudan': 'ss', 'spain': 'es', 'sri lanka': 'lk',
  'sudan': 'sd', 'sweden': 'se', 'switzerland': 'ch', 'syria': 'sy', 'solomon islands': 'sb',
  // T
  'taiwan': 'tw', 'tajikistan': 'tj', 'tanzania': 'tz', 'thailand': 'th',
  'togo': 'tg', 'tonga': 'to', 'trinidad and tobago': 'tt', 'tunisia': 'tn', 'turkey': 'tr',
  'turkmenistan': 'tm',
  // U
  'uganda': 'ug', 'ukraine': 'ua', 'united arab emirates': 'ae',
  'united kingdom': 'gb', 'united states': 'us',
  'uruguay': 'uy', 'uzbekistan': 'uz',
  // V
  'venezuela': 've', 'vietnam': 'vn',
  // Y
  'yemen': 'ye',
  // Z
  'zambia': 'zm', 'zimbabwe': 'zw',
  // Special regions
  
  'european union': 'eu',
  'falkland islands': 'fk',
  'papua new guinea': 'pg',
};

// Custom flags for countries not available on flagcdn or need special images
const CUSTOM_FLAGS: Record<string, string> = {
  'west africa': '/custom-flags/west-africa.jpg',
  'central africa': '/custom-flags/central-africa.jpg',
  'west-africa': '/custom-flags/west-africa.jpg',
  'central-africa': '/custom-flags/central-africa.jpg',
  
  'eritrea': '/custom-flags/langfr-960px-Flag_of_Eritrea.svg.png',
  'netherlands antilles': '/custom-flags/netherlands-antille.jpg',
  'netherlands-antilles': '/custom-flags/netherlands-antille.jpg',
    'french pacific territories': '/custom-flags/Flag_of_French_Polynesia.svg.png',
    'french-pacific-territories': '/custom-flags/Flag_of_French_Polynesia.svg.png',
};

/**
 * Get flag image URL from country name
 * Uses flagcdn.com for high-quality SVG flags
 * Falls back to custom flags if available
 */
export function getCountryFlagUrl(
  countryName: string,
  size: 'h20' | 'h24' | 'h40' | 'h60' | 'h80' | 'h120' = 'h80'
): string {
  const normalizedName = countryName.toLowerCase().trim();
  
  // 1. Check for custom flags first
  if (CUSTOM_FLAGS[normalizedName]) {
    return CUSTOM_FLAGS[normalizedName];
  }
  
  // 2. Try to get the country code
  const code = countryCodeMap[normalizedName];
  
  if (!code) {
    // 3. Return UN flag as fallback if country not found
    return 'https://flagcdn.com/w80/un.png';
  }
  
  // 4. Return flag URL from flagcdn.com
  return `https://flagcdn.com/${size}/${code}.png`;
}

/**
 * Get flag emoji (fallback option)
 */
export function getCountryFlagEmoji(countryName: string): string {
  const normalizedName = countryName.toLowerCase().trim();
  const code = countryCodeMap[normalizedName];
  
  if (!code) {
    return '🏳️';
  }
  
  const codePoints = [...code.toUpperCase()].map(char => 
    127397 + char.charCodeAt(0)
  );
  
  return String.fromCodePoint(...codePoints);
}
