/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything the business owner needs to change lives in this one file.
 *  No component hard-codes a price, a phone number or a product name.
 *
 *  Placeholders you MUST replace before going live are written in SCREAMING
 *  SNAKE CASE or contain XXXXX. Search this file for "REPLACE" to find them all.
 *  Placeholder marketing copy is tagged with  // «placeholder»
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ProductLine = 'her' | 'him' | 'unisex';
export type RoutineStepId = 'cleanse' | 'treat' | 'protect';

export interface Product {
  /** Stable slug. Used in DOM ids, analytics and the WhatsApp message. */
  id: string;
  /** English product name — never translated. */
  name: string;
  line: ProductLine;
  /** Selling price in BDT (whole taka, no decimals). */
  price: number;
  /** Struck-through "before" price. Omit to hide the discount. */
  oldPrice?: number;
  /** e.g. "30ml", "50g" */
  size: string;
  /** One line, Bangla. Shown on cards. */
  shortBenefit: string;
  /** 2–3 sentences, Bangla. Shown in the product showcase. */
  description: string;
  /** English ingredient names, shown as chips. */
  keyIngredients: string[];
  /** Bangla, one line per step. */
  howToUse: string[];
  /** Path under /public. Transparent PNG renders look best. */
  image: string;
  /** Alt text, Bangla. */
  imageAlt: string;
  /** Small ribbon on the card. Omit for none. */
  badge?: string;
  /** Which routine step this product belongs to. */
  step: RoutineStepId;
}

export interface Combo {
  id: string;
  name: string;
  productIds: string[];
  price: number;
  oldPrice: number;
  badge?: string;
  /** Bangla, one line. */
  shortBenefit: string;
  line: ProductLine;
}

export interface Review {
  name: string;
  district: string;
  /** 1–5 */
  rating: number;
  text: string;
  /** Product or combo id this review is about. */
  productId: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Ingredient {
  id: string;
  /** English — never translated. */
  name: string;
  /** Two or three Bangla words. */
  role: string;
  /** Plain-language Bangla explanation, 1–2 sentences. */
  explainer: string;
  /** Which products contain it. */
  productIds: string[];
}

export interface RoutineStep {
  id: RoutineStepId;
  /** "01", "02", "03" */
  index: string;
  labelEn: string;
  labelBn: string;
  blurb: string;
}

export interface SiteConfig {
  brandName: string;
  brandNameBn: string;
  /** Two letters, used as the order-ID prefix, e.g. "GS" gives #GS-4821 */
  orderPrefix: string;
  tagline: string;
  taglineEn: string;
  /** International format, no +, no spaces. */
  whatsappNumber: string;
  bkashNumber: string;
  bkashAccountType: 'Personal' | 'Agent' | 'Merchant';
  deliveryCharge: { insideRajshahi: number; outsideRajshahi: number };
  /** Empty string disables the Meta Pixel entirely — nothing is loaded. */
  facebookPixelId: string;
  facebookPage: string;
  phone: string;
  address: string;
  deliveryTime: string;
  products: Product[];
  combos: Combo[];
  reviews: Review[];
  faq: Faq[];
  ingredients: Ingredient[];
  routine: RoutineStep[];
  /** Product id per line per step. A missing step renders a soft "coming soon" tile. */
  routineMap: Record<Exclude<ProductLine, 'unisex'>, Partial<Record<RoutineStepId, string>>>;
  policies: { delivery: string; returns: string; authenticity: string };
  seo: { title: string; description: string; ogImage: string };
}

export const site = {
  // ── Business identity ─────────────────────────────────────────────────────
  brandName: 'BRAND_NAME', // REPLACE
  brandNameBn: 'ব্র্যান্ড নাম', // REPLACE
  orderPrefix: 'GS', // REPLACE — two letters from the brand, used in order IDs
  tagline: 'পরিষ্কার উপাদান। দৃশ্যমান ফল।', // «placeholder»
  taglineEn: 'Clean actives. Visible results.', // «placeholder»

  // ── Contact & payment ─────────────────────────────────────────────────────
  whatsappNumber: '8801XXXXXXXXX', // REPLACE — international format, no + and no spaces
  bkashNumber: '01XXXXXXXXX', // REPLACE
  bkashAccountType: 'Personal', // 'Personal' shows "Send Money"; 'Merchant' shows "Payment"
  phone: '01XXXXXXXXX', // REPLACE
  facebookPage: 'https://facebook.com/REPLACE_ME',
  address: 'BUSINESS_ADDRESS, রাজশাহী', // REPLACE
  deliveryTime: 'রাজশাহীর ভিতরে ২৪ ঘণ্টা, বাইরে ২–৩ দিন', // «placeholder»

  // ── Money ─────────────────────────────────────────────────────────────────
  deliveryCharge: {
    insideRajshahi: 60,
    outsideRajshahi: 120,
  },

  // ── Tracking. Empty string = no pixel script is loaded at all. ────────────
  facebookPixelId: '',

  // ── Catalogue ─────────────────────────────────────────────────────────────
  products: [
    {
      id: 'vitamin-c-glow-serum',
      name: 'Vitamin C Glow Serum',
      line: 'her',
      price: 1250,
      oldPrice: 1500,
      size: '30ml',
      step: 'treat',
      badge: 'বেস্ট সেলার', // «placeholder»
      shortBenefit: 'মেছতা ও কালো দাগ হালকা করে, ত্বকে স্বাভাবিক উজ্জ্বলতা ফেরায়।', // «placeholder»
      description:
        'স্থিতিশীল ১০% Vitamin C-এর সাথে Niacinamide ও Centella — তিনটি উপাদান একসাথে দাগ হালকা করতে আর ত্বকের টোন সমান করতে কাজ করে। হালকা, আঠালো নয়, দ্রুত মিশে যায়। নিয়মিত ব্যবহারে ৪–৬ সপ্তাহে পার্থক্য চোখে পড়ে।', // «placeholder»
      keyIngredients: ['10% Vitamin C (SAP)', 'Niacinamide 4%', 'Centella Asiatica'],
      howToUse: [
        'রাতে মুখ ধুয়ে শুকনো ত্বকে ৩–৪ ফোঁটা নিন।',
        'হালকাভাবে চেপে চেপে পুরো মুখে মিশিয়ে দিন।',
        'উপরে ময়েশ্চারাইজার লাগান।',
        'দিনে ব্যবহার করলে অবশ্যই সানস্ক্রিন দিন।',
      ],
      image: '/products/vitamin-c-glow-serum.png',
      imageAlt: 'Vitamin C Glow Serum-এর ৩০ মিলি ড্রপার বোতল',
    },
    {
      id: 'hydra-barrier-moisturizer',
      name: 'Hydra Barrier Moisturizer',
      line: 'her',
      price: 950,
      oldPrice: 1100,
      size: '50ml',
      step: 'protect',
      shortBenefit: 'সারাদিন আর্দ্রতা ধরে রাখে, শুষ্কতা ও টানটান ভাব কমায়।', // «placeholder»
      description:
        'Hyaluronic Acid পানি টেনে ধরে, Ceramide ত্বকের প্রাকৃতিক স্তর মেরামত করে, আর Panthenol জ্বালাভাব শান্ত করে। ভারী নয় — তৈলাক্ত ত্বকেও আরামদায়ক।', // «placeholder»
      keyIngredients: ['Hyaluronic Acid', 'Ceramide NP', 'Panthenol (B5)'],
      howToUse: [
        'সিরামের পর অল্প পরিমাণ নিন।',
        'মুখ ও গলায় উপরের দিকে টেনে লাগান।',
        'সকাল ও রাতে ব্যবহার করুন।',
      ],
      image: '/products/hydra-barrier-moisturizer.png',
      imageAlt: 'Hydra Barrier Moisturizer-এর ৫০ মিলি জার',
    },
    {
      id: 'oil-control-face-wash',
      name: 'Oil Control Face Wash',
      line: 'him',
      price: 650,
      oldPrice: 780,
      size: '100ml',
      step: 'cleanse',
      badge: 'পুরুষদের পছন্দ', // «placeholder»
      shortBenefit: 'অতিরিক্ত তেল ও ঘাম পরিষ্কার করে, ব্ল্যাকহেডস কমায়।', // «placeholder»
      description:
        '২% Salicylic Acid লোমকূপের ভিতর থেকে তেল ও ময়লা টেনে বের করে। Green Tea ও Zinc PCA দিনভর তেল নিয়ন্ত্রণে রাখে। ত্বক টানটান করে ফেলে না।', // «placeholder»
      keyIngredients: ['Salicylic Acid 2%', 'Green Tea Extract', 'Zinc PCA'],
      howToUse: [
        'ভেজা মুখে অল্প পরিমাণ নিয়ে ফেনা তৈরি করুন।',
        '৩০ সেকেন্ড বৃত্তাকারে ম্যাসাজ করুন।',
        'ঠান্ডা পানিতে ধুয়ে ফেলুন। দিনে সর্বোচ্চ দুইবার।',
      ],
      image: '/products/oil-control-face-wash.png',
      imageAlt: 'Oil Control Face Wash-এর ১০০ মিলি টিউব',
    },
    {
      id: 'after-shave-calm-balm',
      name: 'After Shave Calm Balm',
      line: 'him',
      price: 890,
      oldPrice: 1050,
      size: '75ml',
      step: 'protect',
      shortBenefit: 'শেভের পর জ্বালা ও লালচে ভাব সাথে সাথে শান্ত করে।', // «placeholder»
      description:
        'অ্যালকোহল-মুক্ত ফর্মুলা, তাই জ্বলে না। Allantoin ও Centella কাটা-ছেঁড়া দ্রুত সারায়, Aloe ঠান্ডা রাখে। শেভের পর ছোট ছোট গোটা হওয়া কমে আসে।', // «placeholder»
      keyIngredients: ['Allantoin', 'Centella Asiatica', 'Aloe Vera'],
      howToUse: [
        'শেভের ঠিক পরে মুখ ধুয়ে নিন।',
        'অল্প পরিমাণ বাম নিয়ে হালকা চেপে লাগান।',
        'শেভ না করলেও রাতে ব্যবহার করতে পারেন।',
      ],
      image: '/products/after-shave-calm-balm.png',
      imageAlt: 'After Shave Calm Balm-এর ৭৫ মিলি বোতল',
    },
  ],

  combos: [
    {
      id: 'combo-glow-duo',
      name: 'Glow Duo',
      line: 'her',
      productIds: ['vitamin-c-glow-serum', 'hydra-barrier-moisturizer'],
      price: 1990,
      oldPrice: 2200,
      badge: '৳২১০ সাশ্রয়',
      shortBenefit: 'দাগ হালকা করা আর আর্দ্রতা ধরে রাখা — দুটোই এক সেটে।', // «placeholder»
    },
    {
      id: 'combo-fresh-start',
      name: 'Fresh Start',
      line: 'him',
      productIds: ['oil-control-face-wash', 'after-shave-calm-balm'],
      price: 1390,
      oldPrice: 1540,
      badge: '৳১৫০ সাশ্রয়',
      shortBenefit: 'পরিষ্কার আর শান্ত — পুরুষদের প্রতিদিনের দুই ধাপ।', // «placeholder»
    },
  ],

  // ── Ingredient explorer ───────────────────────────────────────────────────
  ingredients: [
    {
      id: 'niacinamide',
      name: 'Niacinamide',
      role: 'টোন সমান করে',
      explainer:
        'ভিটামিন B3-এর একটি রূপ। অতিরিক্ত তেল নিয়ন্ত্রণে রাখে, লোমকূপ ছোট দেখায় এবং কালো দাগ ধীরে ধীরে হালকা করে। প্রায় সব ধরনের ত্বকে সহনীয়।', // «placeholder»
      productIds: ['vitamin-c-glow-serum'],
    },
    {
      id: 'hyaluronic-acid',
      name: 'Hyaluronic Acid',
      role: 'আর্দ্রতা ধরে রাখে',
      explainer:
        'নিজের ওজনের বহুগুণ পানি ধরে রাখতে পারে। ত্বকের উপরের স্তরে পানি টেনে এনে শুষ্কতা ও টানটান ভাব কমায়, ফলে ত্বক নরম দেখায়।', // «placeholder»
      productIds: ['hydra-barrier-moisturizer'],
    },
    {
      id: 'vitamin-c',
      name: 'Vitamin C',
      role: 'উজ্জ্বলতা বাড়ায়',
      explainer:
        'মেলানিন তৈরির গতি কমিয়ে দাগ হালকা করে এবং রোদের ক্ষতি থেকে ত্বককে কিছুটা রক্ষা করে। সকালে ব্যবহার করলে সানস্ক্রিন বাধ্যতামূলক।', // «placeholder»
      productIds: ['vitamin-c-glow-serum'],
    },
    {
      id: 'centella',
      name: 'Centella Asiatica',
      role: 'জ্বালা শান্ত করে',
      explainer:
        'থানকুনি পাতার নির্যাস। লালচে ভাব ও জ্বালাপোড়া কমায় এবং ক্ষতিগ্রস্ত ত্বক সারাতে সাহায্য করে। সংবেদনশীল ত্বকের জন্য নিরাপদ।', // «placeholder»
      productIds: ['vitamin-c-glow-serum', 'after-shave-calm-balm'],
    },
    {
      id: 'salicylic-acid',
      name: 'Salicylic Acid',
      role: 'লোমকূপ পরিষ্কার করে',
      explainer:
        'তেলে দ্রবণীয় BHA, তাই লোমকূপের ভিতরে ঢুকে জমে থাকা তেল ও মৃত কোষ সরায়। ব্ল্যাকহেডস ও ব্রণ কমাতে সবচেয়ে কার্যকর উপাদানগুলোর একটি।', // «placeholder»
      productIds: ['oil-control-face-wash'],
    },
  ],

  // ── Routine builder ───────────────────────────────────────────────────────
  routine: [
    {
      id: 'cleanse',
      index: '01',
      labelEn: 'Cleanse',
      labelBn: 'পরিষ্কার',
      blurb: 'দিনের ময়লা, তেল আর দূষণ তুলে ফেলুন — বাকি সব ধাপ এর উপর দাঁড়ায়।', // «placeholder»
    },
    {
      id: 'treat',
      index: '02',
      labelEn: 'Treat',
      labelBn: 'সমাধান',
      blurb: 'সক্রিয় উপাদান দিয়ে নির্দিষ্ট সমস্যায় কাজ করুন — দাগ, তেল বা রুক্ষতা।', // «placeholder»
    },
    {
      id: 'protect',
      index: '03',
      labelEn: 'Protect',
      labelBn: 'সুরক্ষা',
      blurb: 'আর্দ্রতা আটকে রাখুন আর ত্বকের প্রাকৃতিক স্তর মজবুত করুন।', // «placeholder»
    },
  ],

  routineMap: {
    // Leave a step out and the routine renders a soft "coming soon" tile for it.
    her: {
      treat: 'vitamin-c-glow-serum',
      protect: 'hydra-barrier-moisturizer',
    },
    him: {
      cleanse: 'oil-control-face-wash',
      protect: 'after-shave-calm-balm',
    },
  },

  // ── Social proof ──────────────────────────────────────────────────────────
  reviews: [
    {
      name: 'নুসরাত জাহান', // «placeholder»
      district: 'রাজশাহী',
      rating: 5,
      text: 'এক মাস ব্যবহার করেছি। গালের দাগ পুরোপুরি যায়নি, তবে আগের চেয়ে অনেক হালকা। আঠালো লাগে না, এটাই সবচেয়ে ভালো দিক।',
      productId: 'vitamin-c-glow-serum',
    },
    {
      name: 'তানভীর হাসান',
      district: 'ঢাকা',
      rating: 5,
      text: 'শেভের পর মুখ জ্বলত আর ছোট গোটা উঠত। বাম লাগানোর পর সাথে সাথে আরাম লাগে। দুই সপ্তাহে গোটা ওঠা বন্ধ।',
      productId: 'after-shave-calm-balm',
    },
    {
      name: 'ফারহানা আক্তার',
      district: 'চট্টগ্রাম',
      rating: 4,
      text: 'ময়েশ্চারাইজারটা শীতের জন্য পারফেক্ট। গরমে আমার কাছে একটু ভারী লাগে, তাই রাতে ব্যবহার করি।',
      productId: 'hydra-barrier-moisturizer',
    },
    {
      name: 'সাকিব রহমান',
      district: 'সিলেট',
      rating: 5,
      text: 'সারাদিন বাইরে কাজ করি, মুখ তেলতেলে হয়ে যেত। এই ফেসওয়াশে দুপুরের পরেও মুখ ফ্রেশ থাকে।',
      productId: 'oil-control-face-wash',
    },
    {
      name: 'মেহজাবিন ইসলাম',
      district: 'খুলনা',
      rating: 5,
      text: 'অর্ডারের পর WhatsApp-এ সাথে সাথে রিপ্লাই পেয়েছি, তিন দিনে কুরিয়ারে পেয়ে গেছি। প্যাকেজিং ভালো ছিল।',
      productId: 'combo-glow-duo',
    },
    {
      name: 'রাকিবুল ইসলাম',
      district: 'রংপুর',
      rating: 4,
      text: 'কম্বোটা নিয়েছিলাম। দাম হিসেবে ভালো। ডেলিভারি একদিন দেরি হয়েছিল, তবে আগেই জানিয়ে দিয়েছিল।',
      productId: 'combo-fresh-start',
    },
  ],

  faq: [
    {
      q: 'ডেলিভারিতে কত দিন লাগে?',
      a: 'রাজশাহী শহরের ভিতরে সাধারণত ২৪ ঘণ্টার মধ্যে পৌঁছে যায়। রাজশাহীর বাইরে কুরিয়ারে ২–৩ দিন লাগে। অর্ডার কনফার্ম হওয়ার পর WhatsApp-এ ট্র্যাকিং তথ্য জানিয়ে দেওয়া হয়।',
    },
    {
      q: 'প্রোডাক্ট আসল কিনা বুঝব কীভাবে?',
      a: 'প্রতিটি প্রোডাক্টের গায়ে ব্যাচ নম্বর ও মেয়াদ উত্তীর্ণের তারিখ দেওয়া থাকে। পার্সেল খোলার সময় ভিডিও করে রাখুন — কোনো অমিল পেলে সেই ভিডিও দেখিয়ে সরাসরি অভিযোগ করতে পারবেন।',
    },
    {
      q: 'আমার ত্বকে মানাবে কিনা কীভাবে বুঝব?',
      a: 'প্রথমবার ব্যবহারের আগে কানের পিছনে বা হাতের ভাঁজে অল্প লাগিয়ে ২৪ ঘণ্টা অপেক্ষা করুন। জ্বালা বা লালচে ভাব না হলে মুখে ব্যবহার করুন। ত্বকের কোনো রোগ থাকলে আগে চিকিৎসকের পরামর্শ নিন।',
    },
    {
      q: 'bKash পেমেন্ট কীভাবে কাজ করে?',
      a: 'ফর্ম পূরণ করলে মোট টাকার পরিমাণ দেখানো হবে। সেই টাকা আমাদের bKash নাম্বারে Send Money করুন, তারপর ট্রানজেকশনের স্ক্রিনশটটি WhatsApp-এ পাঠিয়ে দিন। স্ক্রিনশট পাওয়ার পর অর্ডার কনফার্ম হয়।',
    },
    {
      q: 'পণ্য ফেরত বা বদল করা যায়?',
      a: 'পার্সেল খোলার ভিডিওসহ ২৪ ঘণ্টার মধ্যে জানালে ভুল পণ্য বা ক্ষতিগ্রস্ত পণ্য বদলে দেওয়া হয়। সিল খোলা বা ব্যবহার করা প্রসাধনী স্বাস্থ্যগত কারণে ফেরত নেওয়া সম্ভব নয়।',
    },
    {
      q: 'ক্যাশ অন ডেলিভারি আছে?',
      a: 'এখন শুধু bKash-এ অগ্রিম পেমেন্টে অর্ডার নেওয়া হয়। এতে ডেলিভারি খরচ কম রাখা যায়, ফলে পণ্যের দামও কম রাখা সম্ভব হয়।',
    },
  ],

  policies: {
    delivery:
      'রাজশাহী শহরের ভিতরে ডেলিভারি চার্জ ৳৬০, রাজশাহীর বাইরে ৳১২০। অর্ডার কনফার্ম হওয়ার পর শহরের ভিতরে ২৪ ঘণ্টা, বাইরে ২–৩ কর্মদিবস।',
    returns:
      'পার্সেল খোলার ভিডিওসহ ২৪ ঘণ্টার মধ্যে জানালে ভুল বা ক্ষতিগ্রস্ত পণ্য বিনামূল্যে বদলে দেওয়া হয়। সিল খোলা প্রসাধনী ফেরতযোগ্য নয়।',
    authenticity:
      'সব পণ্য ব্যাচ নম্বর ও মেয়াদসহ সরবরাহ করা হয়। নকল প্রমাণিত হলে সম্পূর্ণ টাকা ফেরত।',
  },

  seo: {
    title: 'BRAND_NAME — নারী ও পুরুষের জন্য পরিচ্ছন্ন স্কিনকেয়ার', // REPLACE
    description:
      'দাগ, তেল আর শুষ্কতার জন্য গবেষণাভিত্তিক উপাদানে তৈরি স্কিনকেয়ার। সারা বাংলাদেশে ডেলিভারি, bKash পেমেন্ট, WhatsApp-এ অর্ডার।', // «placeholder»
    ogImage: '/og.jpg',
  },
} satisfies SiteConfig;

/* ── Derived helpers (pure, no DOM) ───────────────────────────────────────── */

/** A product or a combo, normalised into the one shape the checkout can price. */
export interface Orderable {
  id: string;
  name: string;
  kind: 'product' | 'combo';
  price: number;
  oldPrice?: number;
  line: ProductLine;
  /** "30ml" for a product, "২টি পণ্য" for a combo. */
  meta: string;
}

export const orderables: Orderable[] = [
  ...site.products.map(
    (p): Orderable => ({
      id: p.id,
      name: p.name,
      kind: 'product',
      price: p.price,
      oldPrice: p.oldPrice,
      line: p.line,
      meta: p.size,
    }),
  ),
  ...site.combos.map(
    (c): Orderable => ({
      id: c.id,
      name: c.name,
      kind: 'combo',
      price: c.price,
      oldPrice: c.oldPrice,
      line: c.line,
      meta: c.productIds.length + 'টি পণ্য',
    }),
  ),
];

export function productById(id: string): Product | undefined {
  return site.products.find((p) => p.id === id);
}

export function orderableById(id: string): Orderable | undefined {
  return orderables.find((o) => o.id === id);
}
