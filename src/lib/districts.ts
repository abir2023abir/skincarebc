/**
 * All 64 districts of Bangladesh, grouped by division so the <select> can use
 * <optgroup> — a flat list of 64 options is painful on a phone.
 */

export interface Division {
  name: string;
  districts: string[];
}

export const divisions: Division[] = [
  {
    name: 'বরিশাল',
    districts: ['বরগুনা', 'বরিশাল', 'ভোলা', 'ঝালকাঠি', 'পটুয়াখালী', 'পিরোজপুর'],
  },
  {
    name: 'চট্টগ্রাম',
    districts: [
      'বান্দরবান',
      'ব্রাহ্মণবাড়িয়া',
      'চাঁদপুর',
      'চট্টগ্রাম',
      'কক্সবাজার',
      'কুমিল্লা',
      'ফেনী',
      'খাগড়াছড়ি',
      'লক্ষ্মীপুর',
      'নোয়াখালী',
      'রাঙ্গামাটি',
    ],
  },
  {
    name: 'ঢাকা',
    districts: [
      'ঢাকা',
      'ফরিদপুর',
      'গাজীপুর',
      'গোপালগঞ্জ',
      'কিশোরগঞ্জ',
      'মাদারীপুর',
      'মানিকগঞ্জ',
      'মুন্সিগঞ্জ',
      'নারায়ণগঞ্জ',
      'নরসিংদী',
      'রাজবাড়ী',
      'শরীয়তপুর',
      'টাঙ্গাইল',
    ],
  },
  {
    name: 'খুলনা',
    districts: [
      'বাগেরহাট',
      'চুয়াডাঙ্গা',
      'যশোর',
      'ঝিনাইদহ',
      'খুলনা',
      'কুষ্টিয়া',
      'মাগুরা',
      'মেহেরপুর',
      'নড়াইল',
      'সাতক্ষীরা',
    ],
  },
  {
    name: 'ময়মনসিংহ',
    districts: ['জামালপুর', 'ময়মনসিংহ', 'নেত্রকোণা', 'শেরপুর'],
  },
  {
    name: 'রাজশাহী',
    districts: [
      'বগুড়া',
      'চাঁপাইনবাবগঞ্জ',
      'জয়পুরহাট',
      'নওগাঁ',
      'নাটোর',
      'পাবনা',
      'রাজশাহী',
      'সিরাজগঞ্জ',
    ],
  },
  {
    name: 'রংপুর',
    districts: [
      'দিনাজপুর',
      'গাইবান্ধা',
      'কুড়িগ্রাম',
      'লালমনিরহাট',
      'নীলফামারী',
      'পঞ্চগড়',
      'রংপুর',
      'ঠাকুরগাঁও',
    ],
  },
  {
    name: 'সিলেট',
    districts: ['হবিগঞ্জ', 'মৌলভীবাজার', 'সুনামগঞ্জ', 'সিলেট'],
  },
];

/** Flat list of all 64 district names. */
export const districts: string[] = divisions.flatMap((d) => d.districts);

export function isKnownDistrict(value: string): boolean {
  return districts.includes(value.trim());
}
