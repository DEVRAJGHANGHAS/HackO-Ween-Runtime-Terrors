/**
 * FoodResQ AI — Central Seed Demo Dataset
 * Realistic Gurugram / Delhi NCR logistics records
 */

function getRelativeIso(hoursFromNow) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + hoursFromNow * 60);
  return d.toISOString();
}

const DEFAULT_USER = {
  id: 'usr_admin_01',
  name: 'Ananya Deshmukh',
  email: 'ananya@foodresq.ai',
  role: 'admin',
  organisationName: 'FoodResQ AI Central Operations',
  phone: '+91 98765 43210',
  city: 'Gurugram'
};

const DEFAULT_ORGANISATIONS = [
  {
    id: 'org_hostel_01',
    name: 'Aryabhatta University Hostel — Mess 2',
    type: 'hostel',
    category: 'provider',
    contactPerson: 'Rameshwar Meena (Warden)',
    phone: '+91 98111 22334',
    email: 'mess2@aryabhatta.edu.in',
    address: 'Campus Sector 43, Golf Course Road',
    city: 'Gurugram',
    coordinates: [28.4595, 77.0988],
    verificationStatus: 'verified',
    description: 'Central campus mess serving 1,400 students daily with fresh dinner preparations.',
    capacityNotes: 'Up to 250 portions daily excess capacity',
    joinedDate: '2025-08-15'
  },
  {
    id: 'org_hotel_02',
    name: 'Grand Amber Banquet & Suites',
    type: 'restaurant',
    category: 'provider',
    contactPerson: 'Chef Kunal Kapoor',
    phone: '+91 98222 33445',
    email: 'banquets@grandamber.com',
    address: 'Sector 29, Leisure Valley Road',
    city: 'Gurugram',
    coordinates: [28.4682, 77.0631],
    verificationStatus: 'verified',
    description: 'Luxury hospitality partner donating unserved executive buffet courses.',
    capacityNotes: 'Cold chain storage available on-site',
    joinedDate: '2025-09-10'
  },
  {
    id: 'org_bakery_03',
    name: 'The Artisan Crust & Oven',
    type: 'restaurant',
    category: 'provider',
    contactPerson: 'Neha Chawla',
    phone: '+91 98333 44556',
    email: 'orders@artisancrust.in',
    address: 'Galleria Market, DLF Phase 4',
    city: 'Gurugram',
    coordinates: [28.4667, 77.0864],
    verificationStatus: 'verified',
    description: 'Specialty bakery donating daily fresh artisanal loaves, sandwiches, and rolls.',
    joinedDate: '2025-10-01'
  },
  {
    id: 'org_ngo_01',
    name: 'Asha Community Shelter & Night Haven',
    type: 'shelter',
    category: 'recipient',
    contactPerson: 'Sister Teresa David',
    phone: '+91 98555 66778',
    email: 'shelter@ashacommunity.org',
    address: 'Behind Civil Lines, Sector 14',
    city: 'Gurugram',
    coordinates: [28.4721, 77.0428],
    verificationStatus: 'verified',
    description: 'Provides refuge and warm meals to 110 unhoused night shelter guests daily.',
    capacityNotes: 'Walk-in dining hall with heated food warmers',
    joinedDate: '2025-08-01'
  },
  {
    id: 'org_ngo_02',
    name: 'Navjyoti Child Care & Learning Centre',
    type: 'ngo',
    category: 'recipient',
    contactPerson: 'Sunil Verma',
    phone: '+91 98666 77889',
    email: 'contact@navjyotichildcare.org',
    address: 'Near Govt School, Sector 10A',
    city: 'Gurugram',
    coordinates: [28.4485, 77.0142],
    verificationStatus: 'verified',
    description: 'Residential shelter and evening learning center supporting 65 children.',
    joinedDate: '2025-08-20'
  },
  {
    id: 'org_ngo_03',
    name: 'Sanjivani Senior Citizen Food Support',
    type: 'community_kitchen',
    category: 'recipient',
    contactPerson: 'Dr. Pushpa Sen',
    phone: '+91 98777 88990',
    email: 'care@sanjivanifood.org',
    address: 'Community Centre, Sector 56',
    city: 'Gurugram',
    coordinates: [28.4239, 77.1042],
    verificationStatus: 'verified',
    description: 'Serves nutritious low-sodium meals to elderly residents and hospice beneficiaries.',
    joinedDate: '2025-09-05'
  },
  {
    id: 'org_ngo_04',
    name: 'Robin Hood Army — Gurugram Hub',
    type: 'food_bank',
    category: 'recipient',
    contactPerson: 'Rohit Bansal',
    phone: '+91 98888 99001',
    email: 'gurugram@robinhoodarmy.com',
    address: 'Sector 31 Community Park Gate',
    city: 'Gurugram',
    coordinates: [28.4552, 77.0519],
    verificationStatus: 'verified',
    description: 'Volunteer network distributing quality food to impoverished settlements.',
    joinedDate: '2025-07-12'
  }
];

const DEFAULT_FOOD_LISTINGS = [
  {
    id: 'fl_hostel_120',
    title: 'Nutritious Steamed Rice, Dal Makhani & Seasonal Veg Mix',
    category: 'prepared_meals',
    providerId: 'org_hostel_01',
    providerName: 'Aryabhatta University Hostel — Mess 2',
    quantity: 120,
    availableQuantity: 120,
    unit: 'portions',
    preparationTime: getRelativeIso(-1.5),
    safeUseDeadline: getRelativeIso(3.5), // Urgent: 3.5 hrs left!
    pickupLocation: {
      address: 'Campus Sector 43, Mess 2 Logistics Bay, Gurugram',
      coordinates: [28.4595, 77.0988]
    },
    storageRequirements: 'Hot Held (>60°C) or Insulated Cambro Containers',
    allergenInfo: ['Dairy (Butter in Dal)', 'Gluten-Free Rice'],
    dietaryType: 'vegetarian',
    urgency: 'Urgent',
    status: 'available',
    notes: 'Hot freshly cooked dinner surplus batch. Clean stainless steel containers ready for transit.',
    createdAt: getRelativeIso(-1)
  },
  {
    id: 'fl_amber_buffet_60',
    title: 'Paneer Butter Masala, Jeera Pulao & Roti Assortment',
    category: 'prepared_meals',
    providerId: 'org_hotel_02',
    providerName: 'Grand Amber Banquet & Suites',
    quantity: 60,
    availableQuantity: 60,
    unit: 'portions',
    preparationTime: getRelativeIso(-2),
    safeUseDeadline: getRelativeIso(4.5),
    pickupLocation: {
      address: 'Grand Amber Staff Entrance, Sector 29, Gurugram',
      coordinates: [28.4682, 77.0631]
    },
    storageRequirements: 'Insulated Hot Container (>60°C)',
    allergenInfo: ['Dairy', 'Wheat / Gluten'],
    dietaryType: 'vegetarian',
    urgency: 'Expiring Soon',
    status: 'available',
    notes: 'Unserved executive seminar buffet course packed in sanitary food-grade aluminium.',
    createdAt: getRelativeIso(-1.5)
  },
  {
    id: 'fl_bakery_breads_45',
    title: 'Whole Wheat Sourdough Loaves & Vegetable Savoury Rolls',
    category: 'bakery',
    providerId: 'org_bakery_03',
    providerName: 'The Artisan Crust & Oven',
    quantity: 45,
    availableQuantity: 45,
    unit: 'portions',
    preparationTime: getRelativeIso(-6),
    safeUseDeadline: getRelativeIso(18),
    pickupLocation: {
      address: 'Shop 14, Galleria Market, DLF Phase 4, Gurugram',
      coordinates: [28.4667, 77.0864]
    },
    storageRequirements: 'Room Temperature / Dry & Cool',
    allergenInfo: ['Gluten', 'Sesame'],
    dietaryType: 'vegetarian',
    urgency: 'Available',
    status: 'available',
    notes: 'Baked fresh today noon. Excellent shelf life for morning meals.',
    createdAt: getRelativeIso(-3)
  }
];

const DEFAULT_DEMANDS = [
  {
    id: 'dm_asha_70',
    recipientId: 'org_ngo_01',
    recipientName: 'Asha Community Shelter & Night Haven',
    category: 'prepared_meals',
    quantityRequested: 70,
    fulfilledQuantity: 0,
    unit: 'portions',
    urgency: 'critical',
    preferredDeliveryWindow: {
      start: getRelativeIso(0.5),
      end: getRelativeIso(2.5)
    },
    receivingCapacity: 100,
    location: {
      address: 'Behind Civil Lines, Sector 14, Gurugram',
      coordinates: [28.4721, 77.0428]
    },
    specialRequirements: ['Vegetarian preferred', 'Hot meal ready to serve'],
    status: 'pending',
    notes: 'Expected dinner crowd of 70-80 unhoused workers arriving by 21:00. Urgent demand.',
    createdAt: getRelativeIso(-1)
  },
  {
    id: 'dm_navjyoti_50',
    recipientId: 'org_ngo_02',
    recipientName: 'Navjyoti Child Care & Learning Centre',
    category: 'prepared_meals',
    quantityRequested: 50,
    fulfilledQuantity: 0,
    unit: 'portions',
    urgency: 'high',
    preferredDeliveryWindow: {
      start: getRelativeIso(1),
      end: getRelativeIso(3)
    },
    receivingCapacity: 65,
    location: {
      address: 'Near Govt School, Sector 10A, Gurugram',
      coordinates: [28.4485, 77.0142]
    },
    specialRequirements: ['Child-friendly mild spices', 'Dairy acceptable'],
    status: 'pending',
    notes: 'Dinner for resident youth and evening tutorial pupils.',
    createdAt: getRelativeIso(-0.8)
  },
  {
    id: 'dm_sanjivani_40',
    recipientId: 'org_ngo_03',
    recipientName: 'Sanjivani Senior Citizen Food Support',
    category: 'prepared_meals',
    quantityRequested: 40,
    fulfilledQuantity: 0,
    unit: 'portions',
    urgency: 'medium',
    preferredDeliveryWindow: {
      start: getRelativeIso(1),
      end: getRelativeIso(4)
    },
    receivingCapacity: 50,
    location: {
      address: 'Community Centre, Sector 56, Gurugram',
      coordinates: [28.4239, 77.1042]
    },
    specialRequirements: ['Low sodium / salt', 'Soft texture'],
    status: 'pending',
    notes: 'Senior citizen dining hall dinner serving.',
    createdAt: getRelativeIso(-1.2)
  }
];

const DEFAULT_DRIVERS = [
  {
    id: 'drv_01_rajesh',
    name: 'Rajesh Kumar',
    phone: '+91 97111 55667',
    vehicleType: 'Electric Van',
    capacityUnits: 80,
    currentCoordinates: [28.4621, 77.0851],
    status: 'available',
    rating: 4.9
  },
  {
    id: 'drv_02_anita',
    name: 'Anita Sharma',
    phone: '+91 97222 66778',
    vehicleType: 'Refrigerated Van',
    capacityUnits: 120,
    currentCoordinates: [28.4699, 77.0552],
    status: 'available',
    rating: 4.95
  },
  {
    id: 'drv_03_vikas',
    name: 'Vikas Verma',
    phone: '+91 97333 77889',
    vehicleType: 'Cargo Auto',
    capacityUnits: 50,
    currentCoordinates: [28.4512, 77.0255],
    status: 'available',
    rating: 4.82
  },
  {
    id: 'drv_04_mohit',
    name: 'Mohit Rao',
    phone: '+91 97444 88990',
    vehicleType: 'Electric Van',
    capacityUnits: 90,
    currentCoordinates: [28.4355, 77.0912],
    status: 'available',
    rating: 4.88
  }
];

const DEFAULT_DELIVERIES = [
  {
    id: 'del_active_901',
    listingId: 'fl_amber_buffet_60',
    demandId: 'dm_sanjivani_40',
    foodTitle: 'Paneer Butter Masala & Jeera Pulao',
    category: 'prepared_meals',
    providerName: 'Grand Amber Banquet & Suites',
    recipientName: 'Sanjivani Senior Citizen Food Support',
    driverName: 'Mohit Rao',
    driverPhone: '+91 97444 88990',
    vehicleType: 'Electric Van',
    quantity: 40,
    unit: 'portions',
    pickupLocation: {
      address: 'Sector 29, Leisure Valley Road, Gurugram',
      coordinates: [28.4682, 77.0631]
    },
    destinationLocation: {
      address: 'Community Centre, Sector 56, Gurugram',
      coordinates: [28.4239, 77.1042]
    },
    safeUseDeadline: getRelativeIso(4),
    status: 'in_transit',
    distanceKm: 6.8,
    createdAt: getRelativeIso(-1),
    timeline: [
      { timestamp: getRelativeIso(-1), status: 'assigned', description: 'Matched and assigned to Driver Mohit Rao' },
      { timestamp: getRelativeIso(-0.6), status: 'picked_up', description: 'Cargo verified at 64°C, insulated containers loaded' },
      { timestamp: getRelativeIso(-0.2), status: 'in_transit', description: 'En-route via Golf Course Extension' }
    ]
  },
  {
    id: 'del_hist_899',
    listingId: 'fl_prev_01',
    demandId: 'dm_prev_01',
    foodTitle: 'Executive Thali Meals (75 Portions)',
    category: 'prepared_meals',
    providerName: 'CyberTech Campus Commons',
    recipientName: 'Asha Community Shelter & Night Haven',
    driverName: 'Rajesh Kumar',
    vehicleType: 'Electric Van',
    quantity: 75,
    unit: 'portions',
    pickupLocation: {
      address: 'DLF CyberCity Building 10B, Gurugram',
      coordinates: [28.4952, 77.0894]
    },
    destinationLocation: {
      address: 'Sector 14 Civil Lines, Gurugram',
      coordinates: [28.4721, 77.0428]
    },
    safeUseDeadline: getRelativeIso(-1),
    status: 'delivered',
    completedAt: getRelativeIso(-2.8),
    distanceKm: 5.4,
    createdAt: getRelativeIso(-4.5),
    proofOfDelivery: {
      recipientSignatureName: 'Sister Teresa David',
      receivedPortions: 75,
      temperatureCelsius: 61.5,
      notes: 'Delivered in immaculate condition. Meals immediately distributed.'
    },
    timeline: [
      { timestamp: getRelativeIso(-4.5), status: 'assigned', description: 'Automated allocation created' },
      { timestamp: getRelativeIso(-3.8), status: 'picked_up', description: 'Collected from CyberTech cafeteria dock' },
      { timestamp: getRelativeIso(-2.8), status: 'delivered', description: 'Delivered & verified by Sister Teresa David' }
    ]
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_01',
    title: 'Urgent Surplus Batch Registered',
    message: 'Aryabhatta Hostel listed 120 dinner portions expiring in 3.5 hrs. Safe allocation required.',
    timestamp: getRelativeIso(-0.1),
    type: 'urgent',
    read: false,
    url: 'matching.html'
  },
  {
    id: 'notif_02',
    title: 'High Urgency Demand Alert',
    message: 'Asha Community Shelter requested 70 portions before 22:00 for 110 unhoused guests.',
    timestamp: getRelativeIso(-0.5),
    type: 'warning',
    read: false,
    url: 'demand.html'
  },
  {
    id: 'notif_03',
    title: 'Delivery in Progress',
    message: 'Driver Mohit Rao picked up 40 portions from Grand Amber Suites. ETA 20 mins.',
    timestamp: getRelativeIso(-0.2),
    type: 'info',
    read: true,
    url: 'deliveries.html'
  }
];
