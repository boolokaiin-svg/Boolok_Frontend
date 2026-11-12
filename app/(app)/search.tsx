import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  useWindowDimensions,
  Image,
  Modal,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import Animated, { FadeIn } from 'react-native-reanimated';
import axios from 'axios';
import { API_BASE_URL, resolveImageUrl } from '../../lib/api';
import { router, useLocalSearchParams } from 'expo-router';

export interface SearchItem {
  id: string;
  type: 'property' | 'legal' | 'news' | 'profile';
  title: string;
  subtitle: string;
  category?: string;
  date?: string;
  image?: string;
  gallery?: string[];
  // Property specific fields
  price?: string;
  pricePerSqft?: string;
  propertyType?: string;
  location?: string;
  specs?: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  capRate?: string;
  description?: string;
  amenities?: string[];
  seller?: {
    name: string;
    title: string;
    agency: string;
    phone: string;
    email: string;
    verified: boolean;
    avatar?: string | null;
    rating: string;
  };
  // Legal & News specific fields
  jurisdiction?: string;
  complianceAlert?: string;
  elaborativeContent?: string;
  keyTakeaways?: string[];
  marketMetrics?: { label: string; value: string }[];
  sourceName?: string;
  sourceUrl?: string;
  profileUser?: any;
}

const COMMUNITY_PROFILES: any[] = [];

const SEARCH_DATABASE: SearchItem[] = [
  // ─── 1. PROPERTIES ────────────────────────────────────────────────────────
  {
    id: 'prop-1',
    type: 'property',
    title: '1240 Commercial Ave, NY',
    subtitle: 'Office Space • 12,000 sqft • $45k/mo',
    category: 'Commercial Office Tower',
    price: '$45,000 / month',
    pricePerSqft: '$45 / sqft / yr',
    propertyType: 'Grade-A Commercial Office',
    location: 'Midtown Manhattan, New York, NY 10018',
    specs: '12,000 sqft • 8 Private Suites • Conference Center',
    sqft: '12,000 sq ft',
    capRate: '7.8% Cap Rate',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
    ],
    description:
      'Premier commercial corporate floor situated in the heart of Midtown Manhattan. Features open-plan collaborative work areas, high-speed fiber optic backbone, private executive boardrooms, floor-to-ceiling double glazed acoustic windows, and LEED Gold certification. Ready for immediate enterprise occupancy with flexible triple net lease covenants.',
    amenities: [
      '24/7 Security & Concierge',
      'LEED Gold Certified',
      'Direct Subway Access',
      'Underground Executive Parking',
      'Fiber Optic Ready',
      'High-Speed Elevators',
    ],
    seller: {
      name: 'Sai Vimenthan',
      title: 'Principal Commercial Broker & Asset Syndicate Lead',
      agency: 'Boolok Elite Commercial Advisors',
      phone: '+1 (212) 555-0194',
      email: 'sai.vimenthan@boolok.ai',
      verified: true,
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
      rating: '4.9 ★ (84 deals closed)',
    },
    sourceName: 'Boolok Commercial MLS Registry',
    sourceUrl: 'https://www.cbre.com',
  },
  {
    id: 'prop-2',
    type: 'property',
    title: 'Luxury Waterfront Villa, Palm Jumeirah',
    subtitle: 'Residential Estate • 7 Beds • 9 Baths • $18.5M',
    category: 'Ultra-Luxury Residential',
    price: '$18,500,000',
    pricePerSqft: '$1,850 / sqft',
    propertyType: 'Turnkey Waterfront Mansion',
    location: 'Frond N, Palm Jumeirah, Dubai, UAE',
    specs: '10,000 sqft • 7 Beds • 9 Baths • Private Beach',
    beds: 7,
    baths: 9,
    sqft: '10,000 sq ft',
    capRate: '8.4% Short-Stay Yield',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
    ],
    description:
      'Architectural masterpiece located on an exclusive private frond in Palm Jumeirah. Boasts private white sand beach frontage, zero-edge infinity pool overlooking the Dubai Marina skyline, bespoke Italian marble flooring, high-ceiling reception salon, and a dedicated yacht slip. Handcrafted smart automation system controlling climate, lighting, and entertainment.',
    amenities: [
      'Private White Sand Beach',
      'Private Mega-Yacht Berth',
      'Infinity Pool & Cabana',
      'Smart Home Automation',
      'Sub-Zero & Miele Kitchen',
      'Private Spa & Sauna',
    ],
    seller: {
      name: 'Mohammed Ajmal',
      title: 'Senior Luxury Residential Broker',
      agency: 'Gulf Prime Waterfront Real Estate',
      phone: '+971 4 388 9200',
      email: 'ajmal@boolok.ai',
      verified: true,
      avatar: null,
      rating: '5.0 ★ (42 luxury acquisitions)',
    },
    sourceName: 'Dubai Land Department Verified Listing',
    sourceUrl: 'https://dubailand.gov.ae',
  },
  {
    id: 'prop-3',
    type: 'property',
    title: 'Grade-A Tech Park Campus, Outer Ring Road',
    subtitle: 'Commercial SEZ • 92,000 sqft • $42.0M',
    category: 'Institutional Tech Park',
    price: '$42,000,000',
    pricePerSqft: '$456 / sqft',
    propertyType: 'Tech Park SEZ Development',
    location: 'Outer Ring Road (ORR), Bellandur, Bangalore, India',
    specs: '92,000 sqft • 100% Occupancy • Fortune 500 Tenants',
    sqft: '92,000 sq ft',
    capRate: '8.6% Cap Rate',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200',
    ],
    description:
      'Institutional Grade-A LEED Platinum IT campus situated in Bangalore’s high-velocity Outer Ring Road tech corridor. Pre-leased to multinational cloud and enterprise software conglomerates with 9-year weighted average lease expiry (WALE). 100% dual DG power backup, integrated food courts, metro station connectivity, and dedicated multi-level car parking.',
    amenities: [
      'LEED Platinum Certified',
      '100% Power Backup Dual DG',
      'Direct Metro Linkage',
      'Multi-Level Parking (650 Bays)',
      'Enterprise Cafeteria & Gym',
      'Triple Net Lease Structure',
    ],
    seller: {
      name: 'Shreekutti',
      title: 'Institutional Acquisitions & Campus Development Lead',
      agency: 'Boolok Real Estate Advisors India',
      phone: '+91 80 4120 7890',
      email: 'shreekutti@boolok.ai',
      verified: true,
      avatar: null,
      rating: '4.9 ★ (18 campus syndications)',
    },
    sourceName: 'India RERA & IT Corridor Portal',
    sourceUrl: 'https://rera.karnataka.gov.in',
  },
  {
    id: 'prop-4',
    type: 'property',
    title: 'Margaret River Commercial Vineyard Estate',
    subtitle: 'Agricultural & Hospitality • 140 Acres • $18.5M',
    category: 'Commercial Vineyard & Estate',
    price: '$18,500,000',
    pricePerSqft: '140 Acres Prime Terroir',
    propertyType: 'Boutique Winery & Luxury Estate',
    location: 'Caves Road, Margaret River, Western Australia 6285',
    specs: '140 Acres • Cellar Door • Certified Water Licenses',
    sqft: '140 Acres (6,098,400 sq ft)',
    capRate: '7.9% Blended Cap Rate',
    image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1200',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    ],
    description:
      'Premier commercial vineyard and boutique hospitality estate in Western Australia’s globally acclaimed Margaret River region. Features 140 acres of mature Cabernet Sauvignon and Chardonnay vines, an award-winning cellar door facility, commercial bottling plant, and unencumbered annual water allocation licenses.',
    amenities: [
      'State-of-the-Art Cellar Door',
      'Annual 220 Megalitre Water License',
      'Full Commercial Fermentation Suite',
      'Private Owner Residence',
      'Tourism Hospitality Permit',
      'Global Export Distribution Covenants',
    ],
    seller: {
      name: 'Logeshwaran A',
      title: 'Architectural Consultant & Real Estate Lead',
      agency: 'Boolok Global Agricultural Syndicate',
      phone: '+61 8 9200 4511',
      email: 'waranlogesh0406@gmail.com',
      verified: true,
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJ_TV7-lpSTfRAQI0wc76yPHoIWaWg_5lgW-i9RxbiPx4tlFk0r=s96-c',
      rating: '5.0 ★ (Verified Google Profile)',
    },
    sourceName: 'Western Australia Landgate Registry',
    sourceUrl: 'https://www.landgate.wa.gov.au',
  },

  // ─── 2. LEGAL (Global Affairs & Real Estate Laws) ──────────────────────────
  {
    id: 'legal-1',
    type: 'legal',
    title: 'Zoning Update: Mixed-Use Developments (Austin, TX)',
    subtitle: 'Compliance Alert • Published 2 days ago',
    category: 'Municipal Zoning & Urban Density',
    date: 'Published 2 days ago • Enacted March 2026',
    jurisdiction: 'Austin, Texas, United States (City Council Resolution)',
    complianceAlert: 'MANDATORY COMPLIANCE FOR HIGH-DENSITY COMMERCIAL CONVERSIONS',
    description:
      'The Austin City Council has enacted sweeping revisions to urban zoning codes, eliminating minimum parking mandates for core transit-oriented mixed-use developments and unlocking vertical density bonuses up to 45 stories.',
    elaborativeContent:
      'Under the newly passed HOME Phase 2 and Transit-Oriented Development (TOD) ordinances, property developers in Austin’s commercial corridors can now build high-density residential towers above retail and office floors without requiring traditional mandatory parking ratios. The legislation aims to lower development costs by an estimated 14% to 18% per square foot and accelerate workforce housing deliveries near planned light rail transit nodes. Real estate sponsors must maintain a 12% affordable housing allocation to access bonus floor area ratios (FAR). Institutional buyers acquiring land in Travis County must adjust financial models to incorporate the revised stormwater detention and green infrastructure credits.',
    keyTakeaways: [
      'Elimination of minimum parking requirements within 1/2 mile of designated transit corridors.',
      'Density bonus unlocks Floor Area Ratio (FAR) increases from 8:1 up to 15:1.',
      'Mandatory 12% affordable unit set-aside for multi-family developments taking density bonus.',
      'Streamlined 60-day administrative site plan review for developments meeting energy codes.',
    ],
    marketMetrics: [
      { label: 'Avg Cost Reduction', value: '16.2%' },
      { label: 'Max Height Bonus', value: '45 Stories' },
      { label: 'Corridor Reach', value: '18 Metro Miles' },
      { label: 'Permit Lead Time', value: '60 Days' },
    ],
    sourceName: 'City of Austin Land Development Code & Urban Planning Review',
    sourceUrl: 'https://www.austintexas.gov/department/housing-and-planning',
  },
  {
    id: 'legal-2',
    type: 'legal',
    title: 'Cross-Border Real Estate Tax (FIRPTA & OECD Pillar Two)',
    subtitle: 'Global Affairs Alert • Foreign Capital Withholding Rules',
    category: 'International Tax & Cross-Border Compliance',
    date: 'Published 4 days ago • International Tax Authority',
    jurisdiction: 'US Department of Treasury / OECD Global Alliance',
    complianceAlert: 'FOREIGN INVESTOR WITHHOLDING & ENTITY STRUCTURE OVERHAUL',
    description:
      'New administrative rules under the Foreign Investment in Real Property Tax Act (FIRPTA) align international real estate holdings with OECD Pillar Two 15% global minimum tax standards.',
    elaborativeContent:
      'The international real estate syndication landscape is confronting unprecedented regulatory alignment as the OECD Pillar Two minimum tax regime takes effect alongside updated US Treasury FIRPTA withholding protocols. Non-resident foreign investors holding real estate through offshore holding companies must now substantiate economic substance in jurisdiction tiers or face withholding adjustments up to 21% on gross disposition gains. The rules significantly impact sovereign wealth funds, family offices, and REIT syndicates operating across London, New York, and Frankfurt. Structured debt and qualifying partner exemptions require new certification filings prior to closing commercial transactions.',
    keyTakeaways: [
      'Mandatory beneficial ownership register (BOI) transparency for all foreign entity buyers.',
      'FIRPTA Section 1445 withholding certificates require 90-day pre-closing electronic clearance.',
      '15% global minimum corporate tax threshold enforced on real estate holding SPVs.',
      'Special treaty exemptions preserved for certified public pension funds and sovereign wealth vehicles.',
    ],
    marketMetrics: [
      { label: 'Minimum Global Tax', value: '15.0%' },
      { label: 'FIRPTA Base Withholding', value: '15% - 21%' },
      { label: 'Pre-Close Clearance', value: '90 Days' },
      { label: 'Affected Jurisdictions', value: '140+ Nations' },
    ],
    sourceName: 'OECD Tax Policy Centre & US Department of the Treasury',
    sourceUrl: 'https://www.oecd.org/tax/beps',
  },
  {
    id: 'legal-3',
    type: 'legal',
    title: 'EU Energy Performance of Buildings Directive (EPBD 2026)',
    subtitle: 'Regulatory Mandate • Decarbonization Standards for Assets',
    category: 'Environmental & Sustainability Law',
    date: 'Published 1 week ago • European Commission',
    jurisdiction: 'European Union (All 27 Member States)',
    complianceAlert: 'ZERO-EMISSION MANDATE FOR ALL COMMERCIAL ASSETS BY 2030',
    description:
      'The European Union has finalized the revised Energy Performance of Buildings Directive (EPBD), mandating that all commercial properties must achieve Grade-E energy efficiency by 2027 and Grade-D by 2030.',
    elaborativeContent:
      'Commercial real estate assets across Europe face the largest capital retrofit cycle in history. Under the adopted EPBD regulations, institutional landlords with properties rated F or G on Energy Performance Certificates (EPC) will face leasing bans and statutory fines unless retrofitting milestones are met. The directive introduces mandatory solar rooftop installations on all new non-residential buildings exceeding 250 square meters. Banks and mortgage lenders are already factoring "brown discount" penalties of 12% to 22% into non-compliant asset valuations, while energy-efficient Grade-A assets enjoy historic green premiums.',
    keyTakeaways: [
      'Commercial assets with EPC rating F or G cannot be re-leased post-2027 in key member states.',
      'Mandatory rooftop photovoltaic or renewable integration on commercial roofs > 250 sq m.',
      'National building renovation plans require 16% reduction in primary energy use by 2030.',
      'Green mortgage financing subsidies available through European Investment Bank facility.',
    ],
    marketMetrics: [
      { label: 'Brown Discount Penalty', value: '-18.5%' },
      { label: 'Green Rent Premium', value: '+11.4%' },
      { label: 'Target Energy Cut', value: '16% by 2030' },
      { label: 'Enforcement Scope', value: 'Commercial & Multi' },
    ],
    sourceName: 'European Commission Directorate-General for Energy',
    sourceUrl: 'https://energy.ec.europa.eu',
  },
  {
    id: 'legal-4',
    type: 'legal',
    title: 'Dubai Strata Law & Golden Visa Real Estate Regulations',
    subtitle: 'Regulatory Alert • DLD Investment Thresholds & Escrow Rules',
    category: 'Middle East Real Estate Jurisprudence',
    date: 'Published 5 days ago • Dubai Land Department',
    jurisdiction: 'Emirate of Dubai, United Arab Emirates (Law No. 6)',
    complianceAlert: 'OFF-PLAN ESCROW ACCOUNT & INVESTOR GOLDEN VISA THRESHOLDS',
    description:
      'Dubai Land Department has simplified the 10-year Golden Visa property investment threshold to AED 2,000,000 (~$545,000 USD) and enacted reinforced escrow protections for off-plan luxury projects.',
    elaborativeContent:
      'The Dubai Land Department (DLD) and Federal Authority for Identity, Citizenship, Customs and Port Security (ICP) have streamlined real estate investor residency pathways. Under the revised framework, buyers who purchase property with a minimum value of AED 2M can secure a 10-year renewable residency visa regardless of whether the property is fully paid, mortgaged, or off-plan, provided the developer has achieved verified construction milestones. Additionally, developers must maintain 20% project escrow holdbacks until 12 months post-handover to guarantee structural warranties and owner association reserve capital.',
    keyTakeaways: [
      'AED 2,000,000 ($545k USD) unlocks 10-year renewable Golden Visa for buyer and family.',
      'Mortgaged and off-plan assets eligible upon developer meeting 20% construction milestone.',
      'Mandatory 20% developer escrow retention held for 365 days post-handover.',
      'Strict criminal penalties for unregistered broker commissions or unauthorized sub-letting.',
    ],
    marketMetrics: [
      { label: 'Min Investment', value: 'AED 2,000,000' },
      { label: 'Residency Term', value: '10 Years (Renewable)' },
      { label: 'Escrow Retention', value: '20% (12 Months)' },
      { label: 'Foreign Capital Inflow', value: '+34.2% YoY' },
    ],
    sourceName: 'Dubai Land Department (DLD) Legal & Legislative Portal',
    sourceUrl: 'https://dubailand.gov.ae/en/laws-regulations',
  },

  // ─── 3. NEWS (Elaborative Global Property Affairs with Source Links) ─────────
  {
    id: 'news-1',
    type: 'news',
    title: 'Global Commercial Office Refinancing: The $1.5T Maturity Wall',
    subtitle: 'Market Analysis • Debt Restructuring & Cap Rate Adjustments',
    category: 'Global Capital Markets',
    date: 'March 2026 • Financial Times & Bloomberg Intelligence',
    description:
      'Global institutional property markets face a pivotal $1.5 trillion commercial real estate debt maturity wave between 2026 and 2028, sparking aggressive office-to-residential conversions and cap rate repricing.',
    elaborativeContent:
      'According to extensive data compiled across North American, European, and Asian financial capitals, over $1.5 trillion in commercial real estate loans originated during the ultra-low interest rate era of 2019–2021 are reaching their final maturity dates. Institutional lenders and private debt funds are requiring owners to inject between 15% and 30% fresh equity to refinance at prevailing 6.5% to 7.2% debt yields.\n\nWhile secondary and commodity office buildings in cities like San Francisco, Chicago, and Frankfurt face valuation write-downs of up to 35%, trophy Grade-A office assets boasting modern ESG specifications continue to set record lease rates. A historic wave of adaptive reuse is gaining momentum, with major municipal governments in New York, London, and Melbourne offering lucrative tax abatements for developers converting obsolete office towers into luxury residential and student accommodation hubs.\n\nPrivate equity mega-funds, including Blackstone, Brookfield, and Starwood, have accumulated over $240 billion in "dry powder" capital to acquire prime distressed assets at discounts. Analysts anticipate that 2026 will mark the bottom of the commercial cycle, presenting generational entry valuations for well-capitalized institutional sponsors.',
    keyTakeaways: [
      '$1.5 Trillion in commercial mortgages maturing across US and Europe through 2028.',
      'Lenders demanding 20% fresh sponsor equity contributions on refinancing transactions.',
      'Office-to-residential conversion velocity surges 44% supported by municipal tax breaks.',
      'Global dry powder reserves reach $240B targeting distressed commercial CBD portfolios.',
    ],
    marketMetrics: [
      { label: 'Maturity Wall', value: '$1.5 Trillion' },
      { label: 'Refi Debt Yield', value: '6.8% - 7.4%' },
      { label: 'Conversion Growth', value: '+44% YoY' },
      { label: 'Institutional Dry Powder', value: '$240 Billion' },
    ],
    sourceName: 'Financial Times & Bloomberg Markets Real Estate Intelligence',
    sourceUrl: 'https://www.bloomberg.com/markets',
  },
  {
    id: 'news-2',
    type: 'news',
    title: 'Waterfront & Trophy Assets: Private Wealth Allocates Record $4.2B',
    subtitle: 'Global Wealth Report • Ultra-Luxury Coastal Inflows',
    category: 'Luxury Real Estate & Private Equity',
    date: 'March 2026 • Knight Frank Global Wealth Report',
    description:
      'Billionaire family offices and ultra-high-net-worth individuals deployed more than $4.2 billion into trophy residential and waterfront properties across Miami, Dubai, Sydney, and the French Riviera.',
    elaborativeContent:
      'The 2026 Global Wealth Report reveals an unprecedented surge in capital preservation strategies, with private family offices shifting an average of 34% of their total asset portfolios into prime real estate. The primary drivers are geopolitical stability, favorable tax residency frameworks, and the enduring scarcity of prime coastal and waterfront real estate.\n\nMiami Beach and Palm Beach recorded a 28% increase in ultra-luxury transactions exceeding $20 million, fueled by corporate executive relocations from high-tax northeastern states. In the Middle East, Dubai’s super-prime residential market recorded over 410 transactions exceeding $10 million in the past twelve months, outperforming both London and New York in velocity. Meanwhile, coastal estates in Western Australia and Sydney’s Eastern Suburbs saw substantial cross-border bidding from Southeast Asian and European institutional families.\n\nArchitectural exclusivity, private dockage capabilities for super-yachts, and comprehensive off-grid microgrid systems have emerged as the top prerequisites among ultra-high-net-worth buyers.',
    keyTakeaways: [
      '$4.2 Billion deployed into trophy waterfront residences across top 6 global markets.',
      'Dubai and Miami lead global super-prime ($10M+) transaction volume for second year running.',
      'Average family office real estate portfolio allocation rises from 27% to 34%.',
      'Private yacht dockage and self-sustaining microgrid systems command a 25% price premium.',
    ],
    marketMetrics: [
      { label: 'Total Inflow', value: '$4.2 Billion' },
      { label: 'Avg Portfolio Share', value: '34.0%' },
      { label: 'Top Markets', value: 'Miami, Dubai, Sydney' },
      { label: 'Dockage Premium', value: '+25.0%' },
    ],
    sourceName: 'Knight Frank Global Wealth & Prime Residential Research',
    sourceUrl: 'https://www.knightfrank.com/research',
  },
  {
    id: 'news-3',
    type: 'news',
    title: 'Interest Rates & Global Central Banks: What Q4 Rate Cuts Mean',
    subtitle: 'Macroeconomic Outlook • Mortgage Trajectories & Cap Rates',
    category: 'Monetary Policy & Mortgage Markets',
    date: 'Published 3 days ago • Reuters Real Estate Finance',
    description:
      'As the Federal Reserve, European Central Bank, and Bank of England prepare for synchronized policy rate reductions, institutional property yields and homebuyer transaction volumes are poised for acceleration.',
    elaborativeContent:
      'Global real estate capital markets are pricing in an inflection point as benchmark central bank policy rates begin their anticipated descent. Long-term sovereign bond yields have compressed 60 basis points, triggering the return of private institutional buyers who remained sidelined during the peak tightening cycle.\n\nFor residential housing markets, average 30-year fixed mortgages are projected to settle around 5.4% to 5.8%, unlocking billions in pent-up inventory as existing homeowners conclude that the "rate-lock effect" is receding. In the commercial sphere, lower borrowing benchmarks are stabilizing capitalization rates across multi-family and industrial logistics assets, with transaction volumes expected to rebound 24% year-over-year in the final half of 2026.\n\nHowever, regional banks remain selective, emphasizing conservative loan-to-value (LTV) ratios below 65% and prioritizing properties with verified cash-flow stability and strong tenant credit profiles.',
    keyTakeaways: [
      'Synchronized central bank rate easing expected to lower benchmark debt costs by 75-100 bps.',
      'Residential transaction volumes anticipated to surge 19% as rate-lock effect dissolves.',
      'Cap rates on industrial logistics and multi-family stabilize around 5.6% - 6.2%.',
      'Underwriting emphasizes conservative 60-65% LTV thresholds and high debt service coverage.',
    ],
    marketMetrics: [
      { label: 'Expected Rate Cut', value: '75-100 bps' },
      { label: '30Y Mortgage Range', value: '5.4% - 5.8%' },
      { label: 'Volume Rebound', value: '+24% YoY' },
      { label: 'Standard LTV Cap', value: '65.0%' },
    ],
    sourceName: 'Reuters International Real Estate & Central Bank Briefing',
    sourceUrl: 'https://www.reuters.com/business',
  },
  {
    id: 'news-4',
    type: 'news',
    title: 'AI in Real Estate: Automated Valuation & PropTech Syndication',
    subtitle: 'Tech Disruption • Predictive Cap Rate Modeling & Tokenization',
    category: 'PropTech & AI Market Intelligence',
    date: 'Published yesterday • Wall Street Journal Tech & Real Estate',
    description:
      'Artificial intelligence underwriting algorithms and spatial computer vision models are transforming commercial property acquisitions, slashing deal underwriting timelines from weeks to minutes.',
    elaborativeContent:
      'The convergence of large generative AI models, spatial satellite analytics, and high-frequency real estate transactional data is driving the most aggressive digital transformation in property history. Major asset management institutions are deploying proprietary AI models to predict neighborhood rental yields, micro-market gentrification trajectories, and climate risk assessments with over 94% accuracy.\n\nAutomated valuation models (AVMs) are replacing traditional static appraisal reports for multi-family and single-family rental portfolios, enabling institutional buyers to submit binding purchase offers within hours of listings going live. Concurrently, fractional property syndication protocols utilizing compliant digital assets are allowing retail investors to participate in commercial Grade-A office and tech park syndications with entry tickets as low as $5,000.\n\nBrokers and asset managers who integrate AI automated property insights are generating 3.4x higher lead conversion rates, establishing AI proficiency as an essential competency for 2026 real estate professionals.',
    keyTakeaways: [
      'AI automated valuation models achieve 94.2% accuracy on commercial and multi-family assets.',
      'Underwriting and due diligence cycle compressed from 21 days down to under 4 hours.',
      'Fractional syndication models lower institutional investment barriers to $5,000 minimums.',
      'PropTech AI adoption among commercial brokerage firms increases 72% in past 18 months.',
    ],
    marketMetrics: [
      { label: 'Model Accuracy', value: '94.2%' },
      { label: 'Underwriting Time', value: '< 4 Hours' },
      { label: 'Brokers AI Growth', value: '+72% YoY' },
      { label: 'Conversion Lift', value: '3.4x' },
    ],
    sourceName: 'The Wall Street Journal Real Estate & PropTech Today',
    sourceUrl: 'https://www.wsj.com/news/realestate',
  },
];

export default function AISearchHubScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const routeParams = useLocalSearchParams<{ q?: string; filter?: string }>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isSaved, setIsSaved] = useState<Record<string, boolean>>({});
  const [apiUsers, setApiUsers] = useState<any[]>([]);

  useEffect(() => {
    if (routeParams.q) {
      setQuery(routeParams.q);
    }
    if (routeParams.filter) {
      setActiveFilter(routeParams.filter);
    }
  }, [routeParams.q, routeParams.filter]);

  // Live profile search from backend
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setApiUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`);
        if (res.data && Array.isArray(res.data.results)) {
          setApiUsers(res.data.results);
        }
      } catch (e) {}
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [liveMemberPosts, setLiveMemberPosts] = useState<SearchItem[]>([]);

  useEffect(() => {
    const fetchLiveListings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/feed`);
        if (res.data && Array.isArray(res.data.posts)) {
          const mapped: SearchItem[] = res.data.posts.map((p: any) => {
            const author = p.author || {};
            return {
              id: `live-${p._id}`,
              type: 'property' as const,
              title: p.title || (p.content ? p.content.slice(0, 45) : 'Exclusive Member Property'),
              subtitle: p.price ? `${p.price} • ${p.location || 'Prime Asset'}` : (p.content ? p.content.slice(0, 50) : 'Verified Listing'),
              category: 'Member Property Listing',
              price: p.price || '$1,450,000',
              propertyType: 'Prime Real Estate Asset',
              location: p.location || 'Global Real Estate Network',
              description: p.content || 'Prime real estate asset listed directly on the Boolok AI network.',
              image: p.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
              gallery: p.mediaUrls && p.mediaUrls.length > 0 ? p.mediaUrls : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200'],
              seller: {
                name: author.fullName || 'Boolok Broker',
                title: author.headline || 'Elite Real Estate Advisor',
                agency: 'Boolok Real Estate Advisors',
                phone: '+1 (800) 555-0199',
                email: author.email || 'contact@boolok.ai',
                verified: true,
                avatar: author.profilePicture || null,
                rating: '5.0 ★ (Verified Member)',
              },
            };
          });
          setLiveMemberPosts(mapped);
        }
      } catch (err) {}
    };
    fetchLiveListings();
  }, []);

  const renderSellerAvatar = (seller: any, size = 52) => {
    if (!seller) return null;
    const name = seller.name || 'Advisor';
    const isSai = name.toLowerCase().includes('sai');
    const isLogesh = name.toLowerCase().includes('logesh');

    let photoUri: string | null = null;
    if (isSai) {
      photoUri = resolveImageUrl(user?.profilePicture);
    } else if (isLogesh) {
      photoUri = resolveImageUrl(seller.profilePicture || seller.avatar || user?.profilePicture);
    } else if (seller.avatar && typeof seller.avatar === 'string' && !seller.avatar.includes('images.unsplash.com')) {
      photoUri = resolveImageUrl(seller.avatar);
    }

    const initial = (name[0] || 'A').toUpperCase();
    const colors = ['#ea580c', '#2563eb', '#059669', '#7c3aed', '#db2777', '#ca8a04', '#0891b2'];
    const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(name.length - 1) || 0);
    const bgColor = colors[charCode % colors.length];

    if (photoUri) {
      return (
        <Image
          source={{ uri: photoUri }}
          style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: '#daa520' }}
        />
      );
    }

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: '#daa520',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: Math.floor(size * 0.44), fontWeight: '800' }}>
          {initial}
        </Text>
      </View>
    );
  };

  const filters = ['All', 'Profiles', 'Properties', 'Legal', 'News'];

  const profileItems = useMemo(() => {
    const allUsers: any[] = [...COMMUNITY_PROFILES];
    if (user) {
      allUsers.unshift({
        id: user.id || user._id || 'self',
        _id: user.id || user._id || 'self',
        fullName: user.fullName || 'User',
        username: user.username || 'user',
        headline: user.headline || 'Real Estate Professional',
        location: user.location || '',
        profilePicture: user.profilePicture || null,
        followerCount: user.followerCount || 0,
        closedDeals: user.closedDeals || '0',
      });
    }

    if (apiUsers.length > 0) {
      const seen = new Set(allUsers.map((u) => (u.username || u.id || u._id || '').toLowerCase()));
      apiUsers.forEach((u) => {
        const key = (u.username || u.id || u._id || '').toLowerCase();
        if (!seen.has(key)) {
          allUsers.push(u);
        }
      });
    }

    return allUsers.map((u): SearchItem => ({
      id: `profile-${u.id || u._id || u.username}`,
      type: 'profile',
      title: u.fullName || u.username,
      subtitle: `@${u.username} • ${u.headline || 'Real Estate Advisor'}`,
      category: 'Verified Member Profile',
      location: u.location || 'Global Real Estate Network',
      description: u.bio || u.headline || 'Verified member on Boolok AI Real Estate network.',
      image: u.profilePicture || null,
      profileUser: u,
    }));
  }, [user, apiUsers]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allItems = [...profileItems, ...liveMemberPosts, ...SEARCH_DATABASE];
    return allItems.filter((item) => {
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Profiles' && item.type === 'profile') ||
        (activeFilter === 'Properties' && item.type === 'property') ||
        (activeFilter === 'Legal' && item.type === 'legal') ||
        (activeFilter === 'News' && item.type === 'news');

      if (!matchesFilter) return false;
      if (!q) {
        return activeFilter === 'Profiles' || item.type !== 'profile';
      }

      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const subMatch = (item.subtitle || '').toLowerCase().includes(q);
      const catMatch = (item.category || '').toLowerCase().includes(q);
      const descMatch = (item.description || '').toLowerCase().includes(q);
      const sellerMatch = item.seller ? item.seller.name.toLowerCase().includes(q) : false;
      const jurisMatch = item.jurisdiction ? item.jurisdiction.toLowerCase().includes(q) : false;
      const userMatch = item.profileUser
        ? (item.profileUser.username || '').toLowerCase().includes(q) ||
          (item.profileUser.fullName || '').toLowerCase().includes(q) ||
          (item.profileUser.headline || '').toLowerCase().includes(q) ||
          (item.profileUser.location || '').toLowerCase().includes(q)
        : false;

      return titleMatch || subMatch || catMatch || descMatch || sellerMatch || jurisMatch || userMatch;
    });
  }, [query, activeFilter, profileItems, liveMemberPosts]);

  const handleOpenItem = (item: SearchItem) => {
    setSelectedItem(item);
    setActiveGalleryIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const toggleSave = (id: string) => {
    setIsSaved((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openSourceUrl = (url?: string) => {
    if (!url) return;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch((err) => console.error('Could not open link:', err));
    }
  };

  const renderItem = ({ item }: { item: SearchItem }) => {
    if (item.type === 'profile') {
      const u = item.profileUser || {};
      const avatarUrl = resolveImageUrl(u.profilePicture || item.image);
      const initial = (item.title || 'U')[0]?.toUpperCase();

      return (
        <Pressable
          onPress={() => router.push({ pathname: '/(app)/profile', params: { id: u.id || u._id || u.username } } as any)}
          style={({ pressed, hovered }: any) => [
            styles.resultCard,
            styles.profileCard,
            {
              backgroundColor: theme.surface,
              borderColor: hovered || pressed ? '#daa520' : theme.outlineVariant,
              transform: [{ scale: pressed ? 0.99 : hovered ? 1.01 : 1 }],
            },
          ]}
        >
          <View style={styles.profileCardHeader}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatarFallback, { backgroundColor: isDark ? '#162338' : '#FEF3C7', borderColor: '#daa520' }]}>
                <Text style={{ color: '#daa520', fontWeight: '800', fontSize: 18 }}>{initial}</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={[styles.profileName, { color: theme.onSurface }]}>{item.title}</Text>
                <MaterialIcons name="verified" size={16} color="#daa520" style={{ marginLeft: 5 }} />
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>PROFILE</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '700', marginTop: 2 }}>
                @{u.username}
              </Text>
              <Text style={{ fontSize: 12, color: theme.onSurfaceVariant, marginTop: 4, lineHeight: 16 }} numberOfLines={2}>
                {u.headline || item.description}
              </Text>
            </View>
          </View>

          {/* Location and Stats */}
          <View style={[styles.profileDetailsRow, { borderTopColor: isDark ? '#1a273c' : '#f0f0f0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <MaterialIcons name="location-on" size={14} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, color: theme.onSurfaceVariant }} numberOfLines={1}>
                {u.location || 'Global Real Estate Network'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 11, color: theme.onSurfaceVariant }}>
                <Text style={{ fontWeight: '800', color: theme.onSurface }}>{u.followerCount || 0}</Text> followers
              </Text>
              {u.closedDeals && (
                <Text style={{ fontSize: 11, color: theme.onSurfaceVariant }}>
                  <Text style={{ fontWeight: '800', color: '#daa520' }}>{u.closedDeals}</Text> deals
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.profileActionRow}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(app)/profile', params: { id: u.id || u._id || u.username } } as any)}
              style={[styles.profileBtnPrimary, { backgroundColor: '#daa520' }]}
            >
              <MaterialIcons name="person" size={15} color="#000000" style={{ marginRight: 4 }} />
              <Text style={{ color: '#000000', fontSize: 12, fontWeight: '800' }}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/(app)/messages',
                params: {
                  userId: u.id || u._id || u.username,
                  username: u.username,
                  fullName: u.fullName || u.username,
                }
              } as any)}
              style={[styles.profileBtnSecondary, { borderColor: isDark ? '#334155' : '#cbd5e1', backgroundColor: isDark ? '#0f1a2e' : '#f8fafc' }]}
            >
              <MaterialIcons name="chat" size={15} color={theme.onSurface} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.onSurface, fontSize: 12, fontWeight: '700' }}>Message</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      );
    }

    const isProp = item.type === 'property';
    const isLegal = item.type === 'legal';
    const isNews = item.type === 'news';

    return (
      <Pressable
        onPress={() => handleOpenItem(item)}
        style={({ pressed, hovered }: any) => [
          styles.resultCard,
          {
            backgroundColor: theme.surface,
            borderColor: hovered || pressed ? '#daa520' : theme.outlineVariant,
            transform: [{ scale: pressed ? 0.99 : hovered ? 1.01 : 1 }],
          },
        ]}
      >
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.resultImage} resizeMode="cover" />
        )}
        <View style={styles.resultInfo}>
          {/* Header Row with Badge and Price / Date */}
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, isProp && styles.propBadge, isLegal && styles.legalBadge, isNews && styles.newsBadge]}>
              <MaterialIcons
                name={isProp ? 'business' : isLegal ? 'gavel' : 'article'}
                size={14}
                color={isProp ? '#e6b800' : isLegal ? '#60a5fa' : '#34d399'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: isProp ? '#e6b800' : isLegal ? '#60a5fa' : '#34d399' },
                ]}
              >
                {item.type.toUpperCase()}
              </Text>
            </View>

            {isProp && item.price && (
              <Text style={styles.cardPriceText}>{item.price}</Text>
            )}
            {!isProp && item.date && (
              <Text style={styles.cardDateText}>{item.date.split('•')[0]}</Text>
            )}
          </View>

          {/* Title */}
          <Text style={[typography.headlineSm, { color: theme.onSurface, marginBottom: 6, fontWeight: '700' }]}>
            {item.title}
          </Text>

          {/* Subtitle / Specs */}
          <Text style={[styles.cardSubtitle, { color: theme.onSurfaceVariant }]}>
            {item.subtitle}
          </Text>

          {/* Footer Metadata */}
          <View style={styles.cardFooter}>
            {isProp && item.seller && (
              <View style={styles.sellerMiniRow}>
                {renderSellerAvatar(item.seller, 22)}
                <Text style={styles.sellerMiniName}>
                  Listed by {item.seller.name}
                </Text>
              </View>
            )}
            {isLegal && item.jurisdiction && (
              <View style={styles.sellerMiniRow}>
                <MaterialIcons name="public" size={14} color="#8b9bb4" style={{ marginRight: 4 }} />
                <Text style={styles.sellerMiniName} numberOfLines={1}>
                  {item.jurisdiction.split('(')[0]}
                </Text>
              </View>
            )}
            {isNews && item.sourceName && (
              <View style={styles.sellerMiniRow}>
                <MaterialIcons name="newspaper" size={14} color="#8b9bb4" style={{ marginRight: 4 }} />
                <Text style={styles.sellerMiniName} numberOfLines={1}>
                  {item.sourceName.split('&')[0]}
                </Text>
              </View>
            )}

            <View style={styles.tapToOpenBadge}>
              <Text style={styles.tapToOpenText}>Open Section</Text>
              <MaterialIcons name="chevron-right" size={16} color="#daa520" />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(400)}>
      <View style={[styles.container, { backgroundColor: theme.surfaceContainerLowest }]}>
        <View style={styles.contentWrapper}>
          {/* Header & Search Bar */}
          <Text style={[typography.headlineLg, { color: theme.onSurface, marginBottom: spacing.md, fontWeight: '800' }]}>
            AI Search Hub
          </Text>

          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={24} color={theme.outline} style={styles.searchIcon} />
            <TextInput
              style={[
                styles.searchInput,
                { backgroundColor: theme.surface, borderColor: theme.outlineVariant, color: theme.onSurface },
              ]}
              placeholder="Search profiles, agents, properties, or laws..."
              placeholderTextColor={theme.outline}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
                <MaterialIcons name="close" size={20} color="#8b9bb4" />
              </Pressable>
            )}
          </View>

          {/* Filters */}
          <View style={styles.filterRow}>
            {filters.map((f) => {
              const active = activeFilter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? '#daa520' : theme.surfaceContainerHigh,
                      borderColor: active ? '#ffd700' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? '#000000' : theme.onSurfaceVariant,
                      fontWeight: active ? '800' : '600',
                      fontSize: 14,
                    }}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Results Area Header */}
          <View style={styles.resultsCounterRow}>
            <Text style={{ color: theme.outline, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>
              {filteredResults.length} RESULTS FOUND
            </Text>
            {activeFilter !== 'All' && (
              <Pressable onPress={() => setActiveFilter('All')}>
                <Text style={{ color: '#daa520', fontSize: 12, fontWeight: '700' }}>Show All</Text>
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredResults}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          />
        </View>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          INTERACTIVE DETAIL MODAL ("TRY TO OPEN THE SECTION")
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: isWide ? 760 : '95%' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                <View
                  style={[
                    styles.modalTypePill,
                    selectedItem?.type === 'property' && styles.propBadge,
                    selectedItem?.type === 'legal' && styles.legalBadge,
                    selectedItem?.type === 'news' && styles.newsBadge,
                  ]}
                >
                  <MaterialIcons
                    name={
                      selectedItem?.type === 'property'
                        ? 'business'
                        : selectedItem?.type === 'legal'
                        ? 'gavel'
                        : 'article'
                    }
                    size={15}
                    color={
                      selectedItem?.type === 'property'
                        ? '#e6b800'
                        : selectedItem?.type === 'legal'
                        ? '#60a5fa'
                        : '#34d399'
                    }
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          selectedItem?.type === 'property'
                            ? '#e6b800'
                            : selectedItem?.type === 'legal'
                            ? '#60a5fa'
                            : '#34d399',
                      },
                    ]}
                  >
                    {selectedItem?.type.toUpperCase()} SECTION
                  </Text>
                </View>
                {selectedItem?.category && (
                  <Text style={styles.modalCategoryText} numberOfLines={1}>
                    • {selectedItem.category}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {selectedItem && (
                  <Pressable onPress={() => toggleSave(selectedItem.id)} style={styles.iconCircleBtn}>
                    <MaterialCommunityIcons
                      name={isSaved[selectedItem.id] ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={isSaved[selectedItem.id] ? '#daa520' : '#8b9bb4'}
                    />
                  </Pressable>
                )}
                <Pressable onPress={handleCloseModal} style={styles.iconCircleBtn}>
                  <MaterialIcons name="close" size={20} color="#ffffff" />
                </Pressable>
              </View>
            </View>

            {/* Scrollable Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  {/* Title & Headline */}
                  <Text style={styles.modalTitleText}>{selectedItem.title}</Text>
                  <Text style={styles.modalSubtitleText}>{selectedItem.subtitle}</Text>

                  {/* ──────────────────────────────────────────────────────────
                      1. PROPERTY DETAIL SECTION (Price & House & Seller)
                  ─────────────────────────────────────────────────────────── */}
                  {selectedItem.type === 'property' && (
                    <View style={styles.sectionContainer}>
                      {/* High-res Image Gallery */}
                      {selectedItem.gallery && selectedItem.gallery.length > 0 && (
                        <View style={styles.galleryContainer}>
                          <Image
                            source={{ uri: selectedItem.gallery[activeGalleryIndex] || selectedItem.image }}
                            style={styles.galleryMainImage}
                            resizeMode="cover"
                          />
                          <View style={styles.galleryThumbRow}>
                            {selectedItem.gallery.map((img, idx) => (
                              <Pressable
                                key={idx}
                                onPress={() => setActiveGalleryIndex(idx)}
                                style={[
                                  styles.galleryThumbItem,
                                  activeGalleryIndex === idx && styles.galleryThumbActive,
                                ]}
                              >
                                <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Prominent Price & Cap Rate Bar */}
                      <View style={styles.priceHighlightBar}>
                        <View>
                          <Text style={styles.priceHighlightLabel}>OFFERING PRICE</Text>
                          <Text style={styles.priceHighlightValue}>{selectedItem.price}</Text>
                          {selectedItem.pricePerSqft && (
                            <Text style={styles.pricePerSqftText}>{selectedItem.pricePerSqft}</Text>
                          )}
                        </View>
                        {selectedItem.capRate && (
                          <View style={styles.capRateBadge}>
                            <Text style={styles.capRateBadgeLabel}>METRIC</Text>
                            <Text style={styles.capRateBadgeVal}>{selectedItem.capRate}</Text>
                          </View>
                        )}
                      </View>

                      {/* Specs Overview Grid */}
                      <View style={styles.specsGrid}>
                        {selectedItem.location && (
                          <View style={styles.specGridItemFull}>
                            <MaterialIcons name="location-on" size={16} color="#daa520" style={{ marginRight: 6 }} />
                            <Text style={styles.specLocationText}>{selectedItem.location}</Text>
                          </View>
                        )}
                        {selectedItem.sqft && (
                          <View style={styles.specGridItem}>
                            <MaterialIcons name="square-foot" size={16} color="#8b9bb4" />
                            <Text style={styles.specItemVal}>{selectedItem.sqft}</Text>
                          </View>
                        )}
                        {selectedItem.propertyType && (
                          <View style={styles.specGridItem}>
                            <MaterialIcons name="apartment" size={16} color="#8b9bb4" />
                            <Text style={styles.specItemVal}>{selectedItem.propertyType}</Text>
                          </View>
                        )}
                        {selectedItem.beds !== undefined && (
                          <View style={styles.specGridItem}>
                            <MaterialIcons name="king-bed" size={16} color="#8b9bb4" />
                            <Text style={styles.specItemVal}>{selectedItem.beds} Bedrooms</Text>
                          </View>
                        )}
                        {selectedItem.baths !== undefined && (
                          <View style={styles.specGridItem}>
                            <MaterialIcons name="bathtub" size={16} color="#8b9bb4" />
                            <Text style={styles.specItemVal}>{selectedItem.baths} Bathrooms</Text>
                          </View>
                        )}
                      </View>

                      {/* House Description */}
                      <View style={styles.descBlock}>
                        <Text style={styles.sectionHeading}>Property Architecture & Overview</Text>
                        <Text style={styles.descBodyText}>{selectedItem.description}</Text>
                      </View>

                      {/* Amenities / Key Features */}
                      {selectedItem.amenities && (
                        <View style={styles.descBlock}>
                          <Text style={styles.sectionHeading}>Key Features & Infrastructure</Text>
                          <View style={styles.amenitiesWrap}>
                            {selectedItem.amenities.map((amenity, idx) => (
                              <View key={idx} style={styles.amenityChip}>
                                <MaterialIcons name="check-circle" size={14} color="#daa520" style={{ marginRight: 5 }} />
                                <Text style={styles.amenityText}>{amenity}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* ── THE PERSON WHO IS TRYING TO SELL IT (Seller Profile) ── */}
                      {selectedItem.seller && (
                        <View style={styles.sellerCardContainer}>
                          <View style={styles.sellerCardHeader}>
                            <MaterialIcons name="verified-user" size={16} color="#daa520" style={{ marginRight: 6 }} />
                            <Text style={styles.sellerCardHeaderTitle}>
                              LISTED BY PROPERTY OWNER / ADVISOR
                            </Text>
                          </View>

                          <View style={styles.sellerInfoRow}>
                            {renderSellerAvatar(selectedItem.seller, 56)}
                            <View style={{ flex: 1, marginLeft: 14 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.sellerNameLarge}>{selectedItem.seller.name}</Text>
                                {selectedItem.seller.verified && (
                                  <MaterialIcons name="verified" size={16} color="#3b82f6" style={{ marginLeft: 6 }} />
                                )}
                              </View>
                              <Text style={styles.sellerTitle}>{selectedItem.seller.title}</Text>
                              <Text style={styles.sellerAgency}>{selectedItem.seller.agency}</Text>
                              <Text style={styles.sellerRatingText}>{selectedItem.seller.rating}</Text>
                            </View>
                          </View>

                          {/* Contact CTAs for the Seller */}
                          <View style={styles.sellerActionRow}>
                            <TouchableOpacity
                              style={styles.sellerPrimaryBtn}
                              onPress={() =>
                                alert(
                                  `Connecting you directly to ${selectedItem.seller?.name} (${selectedItem.seller?.phone}) for private showing...`
                                )
                              }
                            >
                              <MaterialIcons name="phone" size={16} color="#000" style={{ marginRight: 6 }} />
                              <Text style={styles.sellerPrimaryBtnText}>Contact Seller</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.sellerSecondaryBtn}
                              onPress={() =>
                                alert(
                                  `Offer draft initiated for ${selectedItem.title}. Transmitting inquiry to ${selectedItem.seller?.email}...`
                                )
                              }
                            >
                              <MaterialIcons name="email" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                              <Text style={styles.sellerSecondaryBtnText}>Schedule Viewing</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      2. LEGAL DETAIL SECTION (Current Global Affairs & Laws)
                  ─────────────────────────────────────────────────────────── */}
                  {selectedItem.type === 'legal' && (
                    <View style={styles.sectionContainer}>
                      {/* Jurisdiction & Alert Banner */}
                      {selectedItem.complianceAlert && (
                        <View style={styles.legalAlertBanner}>
                          <MaterialIcons name="security" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                          <Text style={styles.legalAlertText}>{selectedItem.complianceAlert}</Text>
                        </View>
                      )}

                      <View style={styles.jurisdictionBar}>
                        <MaterialIcons name="account-balance" size={18} color="#60a5fa" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.jurisdictionLabel}>JURISDICTION / REGULATORY BODY</Text>
                          <Text style={styles.jurisdictionValue}>{selectedItem.jurisdiction}</Text>
                        </View>
                      </View>

                      {/* Market Metrics Strip */}
                      {selectedItem.marketMetrics && (
                        <View style={styles.metricsStrip}>
                          {selectedItem.marketMetrics.map((m, idx) => (
                            <View key={idx} style={styles.metricItem}>
                              <Text style={styles.metricVal}>{m.value}</Text>
                              <Text style={styles.metricLbl}>{m.label}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* In-depth Legal & Global Affairs Analysis */}
                      <View style={styles.descBlock}>
                        <Text style={styles.sectionHeading}>Global Affairs & Regulatory Deep Dive</Text>
                        <Text style={styles.descBodyText}>{selectedItem.elaborativeContent}</Text>
                      </View>

                      {/* Key Legal Takeaways Checklist */}
                      {selectedItem.keyTakeaways && (
                        <View style={styles.descBlock}>
                          <Text style={styles.sectionHeading}>Key Legal Mandates for Brokers & Investors</Text>
                          {selectedItem.keyTakeaways.map((takeaway, idx) => (
                            <View key={idx} style={styles.takeawayRow}>
                              <MaterialIcons name="gavel" size={16} color="#60a5fa" style={{ marginRight: 8, marginTop: 2 }} />
                              <Text style={styles.takeawayText}>{takeaway}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      3. NEWS DETAIL SECTION (Elaborative Property Affairs)
                  ─────────────────────────────────────────────────────────── */}
                  {selectedItem.type === 'news' && (
                    <View style={styles.sectionContainer}>
                      {/* Editorial Header Banner */}
                      <View style={styles.newsEditorialBar}>
                        <MaterialIcons name="public" size={18} color="#34d399" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.newsEditorialLabel}>GLOBAL MARKET INTELLIGENCE</Text>
                          <Text style={styles.newsEditorialDate}>{selectedItem.date}</Text>
                        </View>
                      </View>

                      {/* Market Metrics Strip */}
                      {selectedItem.marketMetrics && (
                        <View style={styles.metricsStrip}>
                          {selectedItem.marketMetrics.map((m, idx) => (
                            <View key={idx} style={styles.metricItem}>
                              <Text style={[styles.metricVal, { color: '#34d399' }]}>{m.value}</Text>
                              <Text style={styles.metricLbl}>{m.label}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Elaborative News Report */}
                      <View style={styles.descBlock}>
                        <Text style={styles.sectionHeading}>Elaborative Market Report</Text>
                        <Text style={styles.descBodyText}>{selectedItem.elaborativeContent}</Text>
                      </View>

                      {/* Strategic Takeaways */}
                      {selectedItem.keyTakeaways && (
                        <View style={styles.descBlock}>
                          <Text style={styles.sectionHeading}>Institutional Market Implications</Text>
                          {selectedItem.keyTakeaways.map((takeaway, idx) => (
                            <View key={idx} style={styles.takeawayRow}>
                              <MaterialIcons name="trending-up" size={16} color="#34d399" style={{ marginRight: 8, marginTop: 2 }} />
                              <Text style={styles.takeawayText}>{takeaway}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* ──────────────────────────────────────────────────────────
                      SOURCE REFERENCE LINK (Required for Legal & News)
                  ─────────────────────────────────────────────────────────── */}
                  {selectedItem.sourceUrl && (
                    <View style={styles.sourceReferenceBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <MaterialIcons name="link" size={18} color="#daa520" style={{ marginRight: 6 }} />
                        <Text style={styles.sourceReferenceHeading}>OFFICIAL SOURCE & REFERENCE</Text>
                      </View>
                      <Text style={styles.sourceReferenceName}>{selectedItem.sourceName}</Text>
                      <TouchableOpacity
                        style={styles.sourceLinkBtn}
                        onPress={() => openSourceUrl(selectedItem.sourceUrl)}
                      >
                        <Text style={styles.sourceLinkBtnText} numberOfLines={1}>
                          View Source ({selectedItem.sourceUrl})
                        </Text>
                        <MaterialIcons name="open-in-new" size={15} color="#daa520" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={{ height: 30 }} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 860,
    flex: 1,
    padding: spacing.xl,
  },
  searchWrap: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  clearBtn: {
    position: 'absolute',
    right: 16,
    top: 18,
    zIndex: 1,
    padding: 2,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultsCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },

  // ── Result Cards ──
  resultCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...Platform.select({ web: { transition: 'all 0.2s ease', cursor: 'pointer' } as any }),
  },
  resultImage: {
    width: 140,
    height: '100%',
    minHeight: 120,
  },
  resultInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  propBadge: {
    backgroundColor: 'rgba(230, 184, 0, 0.12)',
  },
  legalBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  newsBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardPriceText: {
    color: '#e6b800',
    fontWeight: '800',
    fontSize: 14,
  },
  cardDateText: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
    marginTop: 2,
  },
  sellerMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  sellerMiniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  sellerMiniName: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '500',
  },
  tapToOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapToOpenText: {
    color: '#daa520',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#0a121e',
    borderRadius: 16,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  modalHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0e1726',
  },
  modalTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalCategoryText: {
    color: '#8b9bb4',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#162234',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 22,
  },
  modalTitleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 28,
  },
  modalSubtitleText: {
    color: '#8b9bb4',
    fontSize: 14,
    marginBottom: 18,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 16,
  },

  // Gallery
  galleryContainer: {
    marginBottom: 18,
  },
  galleryMainImage: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    marginBottom: 8,
  },
  galleryThumbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryThumbItem: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  galleryThumbActive: {
    borderColor: '#daa520',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },

  // Price bar
  priceHighlightBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 184, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceHighlightLabel: {
    color: '#8b9bb4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceHighlightValue: {
    color: '#ffd700',
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 2,
  },
  pricePerSqftText: {
    color: '#8b9bb4',
    fontSize: 12,
  },
  capRateBadge: {
    backgroundColor: '#131e2f',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#daa520',
    alignItems: 'center',
  },
  capRateBadgeLabel: {
    color: '#8b9bb4',
    fontSize: 10,
    fontWeight: '700',
  },
  capRateBadgeVal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Specs
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  specGridItemFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111b2b',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  specLocationText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  specGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111b2b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  specItemVal: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },

  // Content blocks
  descBlock: {
    marginBottom: 20,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  descBodyText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111b2b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  amenityText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },

  // Seller Card
  sellerCardContainer: {
    backgroundColor: '#0f1a2c',
    borderWidth: 1,
    borderColor: '#daa520',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  sellerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 8,
    marginBottom: 12,
  },
  sellerCardHeaderTitle: {
    color: '#daa520',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sellerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#daa520',
  },
  sellerNameLarge: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  sellerTitle: {
    color: '#8b9bb4',
    fontSize: 13,
    marginTop: 2,
  },
  sellerAgency: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sellerRatingText: {
    color: '#daa520',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  sellerActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sellerPrimaryBtn: {
    flex: 1,
    backgroundColor: '#daa520',
    paddingVertical: 11,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  sellerPrimaryBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  sellerSecondaryBtn: {
    flex: 1,
    backgroundColor: '#1b283d',
    borderWidth: 1,
    borderColor: '#2e3f5b',
    paddingVertical: 11,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  sellerSecondaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Legal specific
  legalAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  legalAlertText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  jurisdictionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111b2b',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  jurisdictionLabel: {
    color: '#8b9bb4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  jurisdictionValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  metricsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  metricItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#111b2b',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  metricVal: {
    color: '#60a5fa',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLbl: {
    color: '#8b9bb4',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#101927',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#19263a',
  },
  takeawayText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  // News specific
  newsEditorialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111b2b',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  newsEditorialLabel: {
    color: '#8b9bb4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  newsEditorialDate: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },

  // Source Box
  sourceReferenceBox: {
    backgroundColor: '#0d1726',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  sourceReferenceHeading: {
    color: '#daa520',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sourceReferenceName: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  sourceLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(218, 165, 32, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  sourceLinkBtnText: {
    color: '#daa520',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  profileCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#daa520',
  },
  profileAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileBadge: {
    backgroundColor: 'rgba(218, 165, 32, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  profileBadgeText: {
    color: '#daa520',
    fontSize: 9,
    fontWeight: '800',
  },
  profileDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  profileActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  profileBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  profileBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
});
