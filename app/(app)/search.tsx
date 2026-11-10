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
import Avatar from '../../components/Avatar';
import AISearchLoadingAnimation from '../../components/AISearchLoadingAnimation';
import FollowButton from '../../components/FollowButton';

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
    id?: string;
    userId?: string;
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

const COMMUNITY_PROFILES: any[] = [
  {
    id: '6ace0e6486b4ca082d9f1431',
    _id: '6ace0e6486b4ca082d9f1431',
    fullName: 'Shreekutti',
    username: 'shreekutti',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok',
    location: 'Bangalore, Karnataka · Tech Parks',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '4',
  },
  {
    id: '6ace0e6586b4ca082d9f1432',
    _id: '6ace0e6586b4ca082d9f1432',
    fullName: 'Logeshwaran A',
    username: 'logeshwarana',
    headline: 'Architectural Consultant & Real Estate Lead',
    location: 'Western Australia · Vineyard Estates',
    profilePicture: 'https://boolokgpt.vercel.app/avatars/logeshwaran_doomsday.png',
    followerCount: 2,
    closedDeals: '3',
  },
  {
    id: '6addf49b5f3925f54f8491f6',
    _id: '6addf49b5f3925f54f8491f6',
    fullName: 'Mithulan R',
    username: 'mithulanr2003',
    headline: 'Architectural Director & Skyscraper Asset Syndicate',
    location: 'Marina Coastal District, Singapore',
    profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',
    followerCount: 0,
    closedDeals: '2',
  },
  {
    id: '6aed5f1234567890abcdef01',
    _id: '6aed5f1234567890abcdef01',
    fullName: 'G Dinesh',
    username: 'pgma251',
    headline: 'Real Estate Professional & Boolok Member',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    profilePicture: 'data:image/png;base64,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',
    followerCount: 0,
    closedDeals: '0',
  },
  {
    id: '6ace0e6586b4ca082d9f1433',
    _id: '6ace0e6586b4ca082d9f1433',
    fullName: 'Mohammed Ajmal',
    username: 'ajmal',
    headline: 'Luxury Living & High-End Residential Broker',
    location: 'Dubai & Kochi · Luxury Villas',
    profilePicture: null,
    followerCount: 3,
    closedDeals: '3',
  },
  {
    id: 'bavadharini_rs',
    _id: 'bavadharini_rs',
    fullName: 'Bavadharini RS',
    username: 'bavadharini_rs',
    headline: 'Interior Designer & Modern Living Specialist',
    location: 'Chennai, Tamil Nadu · Modern Living',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '2',
  },
  {
    id: 'the_akshtr_estate',
    _id: 'the_akshtr_estate',
    fullName: 'Akshat Commercials',
    username: 'the_akshtr_estate',
    headline: 'Commercial Property & Tech Park Portfolio Lead',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '5',
  },
  {
    id: 'prasanth_properties',
    _id: 'prasanth_properties',
    fullName: 'Prasanth Properties',
    username: 'prasanth_properties',
    headline: 'Luxury Waterfront Specialist · Miami & Coastal Estates',
    location: 'Miami, Florida · Coastal Estates',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '4',
  },
  {
    id: 'aswin',
    _id: 'aswin',
    fullName: 'Aswin Real Estate',
    username: 'aswin',
    headline: 'Principal Real Estate Broker & Multi-Family Asset Advisor',
    location: 'Chennai, Tamil Nadu · Luxury & Commercial Assets',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '1',
  },
  {
    id: 'vignesh',
    _id: 'vignesh',
    fullName: 'Vigneshwaran',
    username: 'vignesh',
    headline: 'Prime Architectural Estates & Beverly Hills Luxury Specialist',
    location: 'Beverly Hills, California · Ultra Luxury',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '5',
  },
  {
    id: 'yashwanth',
    _id: 'yashwanth',
    fullName: 'Yashwanth',
    username: 'yashwanth',
    headline: 'Prime Commercial Hubs & Institutional Realty Lead',
    location: 'Chennai & Bangalore · Commercial Hubs',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '4',
  },
  {
    id: 'sophia_luxury',
    _id: 'sophia_luxury',
    fullName: 'Sophia Sterling',
    username: 'sophia_luxury',
    headline: 'European Family Office Principal & Luxury Syndication Client',
    location: 'Geneva, Switzerland & London · Private Capital',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '9',
  },
  {
    id: 'david_sterling',
    _id: 'david_sterling',
    fullName: 'David Sterling',
    username: 'david_sterling',
    headline: 'Managing Director · Sterling Global Capital & Asset Co-Owner',
    location: 'London, UK & Beverly Hills · Private Equity',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '3',
  },
  {
    id: 'marcus_vance',
    _id: 'marcus_vance',
    fullName: 'Marcus Vance',
    username: 'marcus_vance',
    headline: 'Institutional Real Estate Syndicate Lead & Co-Ownership Client',
    location: 'New York, NY · Real Estate Private Equity',
    profilePicture: null,
    followerCount: 2,
    closedDeals: '2',
  },
  {
    id: '6ae2f7c95f0594915c812aa3',
    _id: '6ae2f7c95f0594915c812aa3',
    fullName: 'Subasree',
    username: 'subasree',
    headline: 'Architectural Designer & Sustainable Living Lead',
    location: 'Chennai & Bangalore · Green Architecture',
    profilePicture: null,
    followerCount: 0,
    closedDeals: '3',
  },
];

const SEARCH_DATABASE: SearchItem[] = [
  // ─── 1. PROPERTIES (Curated Institutional Real Estate Registry) ────────────
  {
    id: 'prop-nyc-office',
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
      '/coventry_corporate.jpg',
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
      id: '6a7a0dbb51a42123f22c4edf',
      userId: '6a7a0dbb51a42123f22c4edf',
      name: 'Sai Vimenthan V L',
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
    id: 'prop-marina-tower',
    type: 'property',
    title: 'Marina Coastal Skyscraper & Penthouse',
    subtitle: 'High-Rise Commercial & Residential • 65 Stories • ₹123.6 Cr',
    category: 'Commercial High-Rise & Luxury Penthouse',
    price: '₹123.6 Cr',
    pricePerSqft: '$1,420 / sqft',
    propertyType: 'Turnkey Architectural Skyscraper',
    location: 'Marina Coastal District, Singapore 018989',
    specs: '38,000 sqft • 65 Stories • Sky Atrium & Helipad',
    sqft: '38,000 sq ft',
    capRate: '8.1% Net Yield',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      '/coventry_corporate.jpg',
    ],
    description:
      'Iconic waterfront commercial skyscraper and ultra-luxury sky penthouse positioned along Marina Coastal. Designed by world-renowned structural architects, offering column-free office plates, panoramic harbor views, private high-speed elevator banks, and a rooftop sky lounge with certified private helipad.',
    amenities: [
      'Private Rooftop Helipad',
      'Sky Lounge & Executive Dining',
      'Double-Glazed Low-E Glass Façade',
      'BCA Green Mark Platinum Certified',
      'Smart Destination Elevators',
      'Column-Free Flexible Floorplates',
    ],
    seller: {
      id: '6addf49b5f3925f54f8491f6',
      userId: '6addf49b5f3925f54f8491f6',
      name: 'Mithulan R',
      title: 'Architectural Director & Skyscraper Asset Syndicate',
      agency: 'Boolok Asia-Pacific Institutional Partners',
      phone: '+65 6789 0122',
      email: 'mithulan@boolok.ai',
      verified: true,
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',
      rating: '4.9 ★ (26 high-rise acquisitions)',
    },
    sourceName: 'Singapore Urban Redevelopment Authority (URA)',
    sourceUrl: 'https://www.ura.gov.sg',
  },
  {
    id: 'prop-whitefield-sez',
    type: 'property',
    title: 'Whitefield Commercial IT SEZ',
    subtitle: 'Enterprise Tech Corridor • 78,000 sqft • ₹28.0 Cr',
    category: 'Enterprise Tech Corridor Hub',
    price: '₹28.0 Cr',
    pricePerSqft: '$358 / sqft',
    propertyType: 'Special Economic Zone (SEZ) Campus',
    location: 'EPIP Zone, Whitefield, Bangalore, India',
    specs: '78,000 sqft • Fully Leased • N+1 Infrastructure',
    sqft: '78,000 sq ft',
    capRate: '8.8% Cap Rate',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
    gallery: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    ],
    description:
      'High-specification commercial office development in the prime EPIP Zone of Whitefield. Purpose-built for multinational technology firms with 100% captive solar power integration, high-capacity server rooms, redundant fiber rings, and campus security amenities.',
    amenities: [
      'Captive Solar Power Array',
      'Redundant Tier-3 Data Connectivity',
      'SEZ Tax Incentive Covenants',
      'Executive Auditorium (250 Seats)',
      'Multi-Level Covered Parking',
      '24/7 Monitored Access Control',
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
    id: 'prop-coventry-hq',
    type: 'property',
    title: 'Coventry Corporate Headquarters',
    subtitle: 'Institutional Office Hub • 52,000 sqft • £12,242,788',
    category: 'Corporate Headquarters Office',
    price: '£12,242,788',
    pricePerSqft: '$317 / sqft',
    propertyType: 'Single-Tenant Enterprise HQ',
    location: 'Business Park, Coventry, United Kingdom CV3 4PW',
    specs: '52,000 sqft • 100% Occupancy • Long-Term Blue-Chip Covenant',
    sqft: '52,000 sq ft',
    capRate: '8.2% Cap Rate',
    image: '/coventry_corporate.jpg',
    gallery: [
      '/coventry_corporate.jpg',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    ],
    description:
      'Flagship institutional office headquarters building located in the premier Coventry business park corridor. Fully occupied by blue-chip enterprise tenant on an unexpired 12-year FRI lease term, providing robust sovereign-grade cash yields with upward-only rent reviews.',
    amenities: [
      'BREEAM Excellent Rating',
      'Unexpired 12-Year FRI Lease',
      'Secure Underground Car Park (320 Bays)',
      'High-Efficiency VRF Climate Systems',
      'Landscaped Corporate Campus Grounds',
      'Direct Access to A45 & M42 Motorways',
    ],
    seller: {
      id: '6a7a0dbb51a42123f22c4edf',
      userId: '6a7a0dbb51a42123f22c4edf',
      name: 'Sai Vimenthan V L',
      title: 'Principal Commercial Broker & Asset Syndicate Lead',
      agency: 'Boolok Elite Commercial Advisors',
      phone: '+44 20 7946 0912',
      email: 'saivimenthanvl@gmail.com',
      verified: true,
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocK0o5SZUMa-JTOuTUTxS6t1Bl20HPwVkbFAz98dCG6e1rbpGA=s96-c',
      rating: '5.0 ★ (Verified Asset Owner)',
    },
    sourceName: 'HM Land Registry UK Official Title',
    sourceUrl: 'https://www.gov.uk/government/organisations/land-registry',
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
  const [isSearching, setIsSearching] = useState(false);
  const [profileOverrides, setProfileOverrides] = useState<Record<string, { isFollowing: boolean; followerCount?: number }>>({});

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleFollowChange = (e: any) => {
        const detail = e.detail;
        if (!detail) return;
        const keys = [
          detail.userId ? String(detail.userId).toLowerCase() : null,
          detail.username ? String(detail.username).toLowerCase() : null,
        ].filter(Boolean) as string[];

        setProfileOverrides((prev) => {
          const next = { ...prev };
          keys.forEach((k) => {
            next[k] = {
              isFollowing: detail.isFollowing,
              followerCount: detail.followerCount,
            };
          });
          return next;
        });

        setApiUsers((prev) =>
          prev.map((u) => {
            const uid = String(u.id || u._id || '').toLowerCase();
            const uname = String(u.username || '').toLowerCase();
            if (keys.includes(uid) || keys.includes(uname)) {
              return {
                ...u,
                isFollowing: detail.isFollowing,
                followerCount: typeof detail.followerCount === 'number' ? detail.followerCount : u.followerCount,
              };
            }
            return u;
          })
        );
      };

      window.addEventListener('boolok_follow_changed', handleFollowChange);
      return () => window.removeEventListener('boolok_follow_changed', handleFollowChange);
    }
  }, []);

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
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`);
        if (res.data && Array.isArray(res.data.results)) {
          setApiUsers(res.data.results);
        }
      } catch (e) {
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
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
            // Resolve canonical cover image based on property title or author
            let fallbackImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200';
            const titleLower = (p.title || '').toLowerCase();
            if (titleLower.includes('coventry')) {
              fallbackImage = '/coventry_corporate.jpg';
            } else if (titleLower.includes('commercial it campus') || titleLower.includes('tech park')) {
              fallbackImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200';
            } else if (titleLower.includes('vineyard') || titleLower.includes('margaret river')) {
              fallbackImage = 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200';
            } else if (titleLower.includes('poes garden') || titleLower.includes('mansion') || (titleLower.includes('villa') && !titleLower.includes('waterfront'))) {
              fallbackImage = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200';
            } else if (titleLower.includes('waterfront') || titleLower.includes('palm jumeirah')) {
              fallbackImage = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200';
            } else if (titleLower.includes('whitefield') || titleLower.includes('sez')) {
              fallbackImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200';
            } else if (titleLower.includes('marina coastal') || titleLower.includes('skyscraper')) {
              fallbackImage = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200';
            }

            const chosenImage = (p.mediaUrls?.[0] || p.mediaUrl || p.image || fallbackImage);

            const cLower = (p.content || '').toLowerCase();
            let resolvedTitle = p.title;
            let resolvedPrice = p.price;
            let resolvedLoc = p.location;

            if (!resolvedTitle) {
              if (cLower.includes('turnkey institutional it campus') || cLower.includes('leed platinum')) {
                resolvedTitle = 'Grade-A Commercial IT Campus';
                resolvedPrice = '₹34.5 Cr';
                resolvedLoc = 'Outer Ring Road, Bangalore';
              } else if (cLower.includes('vineyard') || cLower.includes('agricultural')) {
                resolvedTitle = 'Margaret River Commercial Vineyard Estate';
                resolvedPrice = 'A$3,485,000';
                resolvedLoc = 'Margaret River, Western Australia';
              } else if (cLower.includes('poes garden') || cLower.includes('residential mansion')) {
                resolvedTitle = 'Poes Garden Ultra-Luxury Bespoke Mansion';
                resolvedPrice = '₹22.0 Cr';
                resolvedLoc = 'Poes Garden, Chennai';
              } else if (cLower.includes('waterfront villa') || cLower.includes('palm jumeirah')) {
                resolvedTitle = 'Waterfront Panoramic Luxury Villa';
                resolvedPrice = 'AED 8,320,000';
                resolvedLoc = 'Palm Jumeirah, Dubai';
              } else if (cLower.includes('coventry') || cLower.includes('grade-a institutional office')) {
                resolvedTitle = 'Coventry Corporate Headquarters';
                resolvedPrice = '£12,242,788';
                resolvedLoc = 'Coventry, United Kingdom';
              } else if (cLower.includes('omr it corridor') || cLower.includes('modern commercial tower') || cLower.includes('grade-a office hub')) {
                resolvedTitle = 'Institutional Grade-A Office Hub';
                resolvedPrice = '₹292.3 Cr';
                resolvedLoc = 'OMR IT Corridor, Chennai';
              } else if (p.content) {
                resolvedTitle = p.content.slice(0, 55);
                resolvedLoc = 'Global Real Estate Network';
              } else {
                resolvedTitle = 'Exclusive Member Property';
                resolvedLoc = 'Global Real Estate Network';
              }
            }

            if (!resolvedPrice) {
              if (resolvedLoc.toLowerCase().includes('bangalore') || resolvedLoc.toLowerCase().includes('chennai') || resolvedLoc.toLowerCase().includes('india')) {
                resolvedPrice = '₹34.5 Cr';
              } else if (resolvedLoc.toLowerCase().includes('coventry') || resolvedLoc.toLowerCase().includes('united kingdom')) {
                resolvedPrice = '£12,242,788';
              } else {
                resolvedPrice = '$1,450,000';
              }
            }

            return {
              id: `live-${p._id}`,
              type: 'property' as const,
              title: resolvedTitle,
              subtitle: `${resolvedPrice} • ${resolvedLoc}`,
              category: 'Member Property Listing',
              price: resolvedPrice,
              propertyType: 'Prime Real Estate Asset',
              location: resolvedLoc,
              specs: p.specs || '',
              description: p.content || 'Prime real estate asset listed directly on the Boolok AI network.',
              image: chosenImage,
              gallery: p.mediaUrls && p.mediaUrls.length > 0 ? p.mediaUrls : [chosenImage],
              seller: {
                id: author._id || author.id,
                userId: author._id || author.id,
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
    return (
      <Avatar
        user={{
          id: seller.id || seller.userId,
          _id: seller.id || seller.userId,
          username: seller.username,
          fullName: seller.name,
          profilePicture: seller.avatar || seller.profilePicture,
        }}
        size={size}
      />
    );
  };

  const filters = ['All', 'Profiles', 'Properties', 'Legal', 'News'];

  const profileItems = useMemo(() => {
    const allUsers: any[] = [...COMMUNITY_PROFILES];
    if (user) {
      allUsers.unshift({
        id: user.id || user._id || 'self',
        _id: user.id || user._id || 'self',
        fullName: user.fullName || 'Boolok Member',
        username: user.username || 'member',
        headline: user.headline || 'Elite Real Estate Broker & Commercial Portfolio Lead',
        location: user.location || 'Chennai, Tamil Nadu · Prime Assets',
        profilePicture: user.profilePicture || null,
        followerCount: user.followerCount || 0,
        closedDeals: String(user.closedDeals || '3'),
      });
    }

    const EXCLUDED_SEARCH_IDS = new Set([
      '6aed46c6c434745e57daa204', // @brokers
      '6ae9bc64b549b88abf72eabf', // @logesh
      '6ae9bd78b549b88abf72eac0', // @mithulan_r_archived
      '6ae95fadfc368c444958f948', // @profile
      '6ae831133794c3dc22c0673b', // @advisor
      '6ae8317d3794c3dc22c0673c',
      '6ae831c93794c3dc22c0673d',
      '6aeddcf9b640ccc8aeca4191',
    ]);
    const EXCLUDED_SEARCH_USERNAMES = new Set([
      'brokers',
      'logesh',
      'mithulan_r_archived',
      'profile',
      'advisor',
    ]);

    if (apiUsers.length > 0) {
      apiUsers.forEach((u) => {
        const uId = String(u.id || u._id || '').toLowerCase();
        const uName = String(u.username || '').toLowerCase();
        if (EXCLUDED_SEARCH_IDS.has(uId) || EXCLUDED_SEARCH_USERNAMES.has(uName) || u.isArchived || u.isTestAccount) {
          return;
        }
        const existingIdx = allUsers.findIndex(
          (x) =>
            (x.id && String(x.id).toLowerCase() === uId) ||
            (x._id && String(x._id).toLowerCase() === uId) ||
            (x.username && String(x.username).toLowerCase() === uName)
        );
        if (existingIdx !== -1) {
          // Update with live authoritative values from backend
          allUsers[existingIdx] = { ...allUsers[existingIdx], ...u };
        } else {
          allUsers.push(u);
        }
      });
    }

    return allUsers
      .filter((u) => {
        const uId = String(u.id || u._id || '').toLowerCase();
        const uName = String(u.username || '').toLowerCase();
        return !EXCLUDED_SEARCH_IDS.has(uId) && !EXCLUDED_SEARCH_USERNAMES.has(uName) && !u.isArchived && !u.isTestAccount;
      })
      .map((u): SearchItem => ({
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
    // Deduplicate items by canonical title / id across live posts and static registry
    const seenPropertyTitles = new Set<string>();
    const dedupedLivePosts = liveMemberPosts.filter((item) => {
      const key = (item.title || '').trim().toLowerCase();
      if (!key || seenPropertyTitles.has(key)) return false;
      seenPropertyTitles.add(key);
      return true;
    });

    const currentUserId = user?.id || user?._id || '6a7a0dbb51a42123f22c4edf';
    const currentUserFullName = user?.fullName || 'Boolok Member';

    const dedupedDatabase = SEARCH_DATABASE.filter((item) => {
      if (item.type !== 'property') return true;
      const key = (item.title || '').trim().toLowerCase();
      if (!key || seenPropertyTitles.has(key)) return false;
      seenPropertyTitles.add(key);
      return true;
    }).map((item) => {
      if (item.type === 'property' && item.seller) {
        const s = item.seller;
        const isAuthUserListing = (s.userId && (s.userId === currentUserId || s.userId === '6a7a0dbb51a42123f22c4edf')) ||
          s.name.toLowerCase().includes('sai vimenthan') ||
          s.email === 'saivimenthanvl@gmail.com' ||
          s.email === 'sai.vimenthan@boolok.ai';
        if (isAuthUserListing) {
          return {
            ...item,
            seller: {
              ...s,
              name: currentUserFullName,
            },
          };
        }
      }
      return item;
    });

    const allItems = [...profileItems, ...dedupedLivePosts, ...dedupedDatabase];
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
      const uIdKey = String(u.id || u._id || '').toLowerCase();
      const uNameKey = String(u.username || '').toLowerCase();
      const override = profileOverrides[uIdKey] || profileOverrides[uNameKey];
      const effectiveFollowerCount = override && typeof override.followerCount === 'number'
        ? override.followerCount
        : (typeof u.followerCount === 'number' ? u.followerCount : 0);
      const effectiveIsFollowing = override && typeof override.isFollowing === 'boolean'
        ? override.isFollowing
        : u.isFollowing;

      return (
        <Pressable
          onPress={() => router.push({ pathname: '/(app)/profile', params: { id: u.id || u._id || u.username } } as any)}
          style={({ pressed, hovered }: any) => [
            styles.resultCard,
            styles.profileCard,
            {
              backgroundColor: theme.surface,
              borderColor: hovered || pressed ? '#F5A623' : theme.outlineVariant,
              transform: [{ scale: pressed ? 0.99 : hovered ? 1.01 : 1 }],
            },
          ]}
        >
          <View style={styles.profileCardHeader}>
            <Avatar user={u} size={48} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={[styles.profileName, { color: theme.onSurface }]}>{item.title}</Text>
                <MaterialIcons name="verified" size={16} color="#F5A623" style={{ marginLeft: 5 }} />
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
                <Text style={{ fontWeight: '800', color: theme.onSurface }}>{effectiveFollowerCount}</Text> followers
              </Text>
              {u.closedDeals && (
                <Text style={{ fontSize: 11, color: theme.onSurfaceVariant }}>
                  <Text style={{ fontWeight: '800', color: '#F5A623' }}>{u.closedDeals}</Text> deals
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.profileActionRow}>
            <FollowButton
              targetUserId={u.id || u._id}
              targetUsername={u.username}
              targetUser={{ ...u, followerCount: effectiveFollowerCount, isFollowing: effectiveIsFollowing }}
              initialIsFollowing={effectiveIsFollowing}
              size="sm"
              style={{ flex: 1, minWidth: 95, flexShrink: 0 }}
            />

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(app)/profile', params: { id: u.id || u._id || u.username } } as any)}
              style={[styles.profileBtnPrimary, { backgroundColor: '#F5A623', flex: 1 }]}
            >
              <MaterialIcons name="person" size={15} color="#000000" style={{ marginRight: 4 }} />
              <Text style={{ color: '#000000', fontSize: 12, fontWeight: '800' }}>Profile</Text>
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
          !isWide && { flexDirection: 'column' },
          {
            backgroundColor: theme.surface,
            borderColor: hovered || pressed ? '#F5A623' : theme.outlineVariant,
            transform: [{ scale: pressed ? 0.99 : hovered ? 1.01 : 1 }],
          },
        ]}
      >
        {item.image && (
          <Image
            source={{ uri: resolveImageUrl(item.image) || item.image }}
            style={[
              styles.resultImage,
              !isWide && { width: '100%', height: 180, minHeight: 180 },
            ]}
            resizeMode="cover"
          />
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
          <Text
    style={[typography.headlineSm, { color: theme.onSurface, marginBottom: 6, fontWeight: '700', flexShrink: 1, lineHeight: 22 }]}
    numberOfLines={2}
    ellipsizeMode="tail"
  >
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
              <MaterialIcons name="chevron-right" size={16} color="#F5A623" />
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
            style={{ marginBottom: spacing.sm, minHeight: 50 }}
          >
            {filters.map((f) => {
              const active = activeFilter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? '#F5A623' : theme.surfaceContainerHigh,
                      borderColor: active ? '#ffd700' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{
                      color: active ? '#000000' : (isDark ? '#E2E8F0' : '#1E293B'),
                      fontWeight: active ? '800' : '700',
                      fontSize: 13,
                      lineHeight: 18,
                      includeFontPadding: false,
                      textAlign: 'center',
                    }}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Results Area Header */}
          <View style={styles.resultsCounterRow}>
            <Text style={{ color: theme.outline, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>
              {filteredResults.length} RESULTS FOUND
            </Text>
            {activeFilter !== 'All' && (
              <Pressable onPress={() => setActiveFilter('All')}>
                <Text style={{ color: '#F5A623', fontSize: 12, fontWeight: '700' }}>Show All</Text>
              </Pressable>
            )}
          </View>

          {isSearching && (
            <AISearchLoadingAnimation
              isDark={isDark}
              query={query}
            />
          )}

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
                    {selectedItem?.type.toUpperCase()}
                  </Text>
                </View>
                {selectedItem?.category && (
                  <Text style={[styles.modalCategoryText, { flex: 1 }]} numberOfLines={1}>
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
                      color={isSaved[selectedItem.id] ? '#F5A623' : '#8b9bb4'}
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
                            source={{ uri: resolveImageUrl(selectedItem.gallery[activeGalleryIndex] || selectedItem.image) || (selectedItem.gallery[activeGalleryIndex] || selectedItem.image) }}
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
                                <Image source={{ uri: resolveImageUrl(img) || img }} style={styles.thumbImage} resizeMode="cover" />
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
                            <MaterialIcons name="location-on" size={16} color="#F5A623" style={{ marginRight: 6 }} />
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
                                <MaterialIcons name="check-circle" size={14} color="#F5A623" style={{ marginRight: 5 }} />
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
                            <MaterialIcons name="verified-user" size={16} color="#F5A623" style={{ marginRight: 6 }} />
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
                        <MaterialIcons name="link" size={18} color="#F5A623" style={{ marginRight: 6 }} />
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
                        <MaterialIcons name="open-in-new" size={15} color="#F5A623" style={{ marginLeft: 6 }} />
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
    paddingHorizontal: 16,
    paddingVertical: spacing.md,
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
  filterScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
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
    gap: 8,
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
    color: '#F5A623',
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
    borderColor: '#F5A623',
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
    borderColor: '#F5A623',
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
    borderColor: '#F5A623',
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
    color: '#F5A623',
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
    borderColor: '#F5A623',
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
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  sellerActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sellerPrimaryBtn: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: '#1b283d',
    borderWidth: 1,
    borderColor: '#2e3f5b',
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    color: '#F5A623',
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
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  profileCard: {
    flexDirection: 'column',
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
    borderColor: '#F5A623',
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
    color: '#F5A623',
    fontSize: 9,
    fontWeight: '800',
  },
  profileDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
  },
  profileActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  profileBtnPrimary: {
    flex: 1,
    minWidth: 95,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  profileBtnSecondary: {
    flex: 1,
    minWidth: 95,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});

