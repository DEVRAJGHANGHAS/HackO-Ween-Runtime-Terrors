/**
 * FoodResQ AI — LocalStorage Management Layer
 * Handles browser persistence, synchronization, and seed data initialization.
 */

const STORAGE_KEYS = {
  USER: 'foodresq_user',
  THEME: 'foodresq_theme',
  ORGS: 'foodresq_organisations',
  LISTINGS: 'foodresq_listings',
  DEMANDS: 'foodresq_demands',
  DRIVERS: 'foodresq_drivers',
  DELIVERIES: 'foodresq_deliveries',
  NOTIFICATIONS: 'foodresq_notifications',
  SIMULATION: 'foodresq_simulation'
};

const StorageManager = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      this.resetAll();
    }
  },

  resetAll() {
    const user = typeof DEFAULT_USER !== 'undefined' ? DEFAULT_USER : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.personas.admin : { name: 'Admin User', role: 'admin', organization: 'Central Food Bank' });
    const orgs = typeof DEFAULT_ORGANISATIONS !== 'undefined' ? DEFAULT_ORGANISATIONS : [];
    const listings = typeof DEFAULT_FOOD_LISTINGS !== 'undefined' ? DEFAULT_FOOD_LISTINGS : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.listings : []);
    const demands = typeof DEFAULT_DEMANDS !== 'undefined' ? DEFAULT_DEMANDS : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.demand : []);
    const drivers = typeof DEFAULT_DRIVERS !== 'undefined' ? DEFAULT_DRIVERS : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.drivers : []);
    const deliveries = typeof DEFAULT_DELIVERIES !== 'undefined' ? DEFAULT_DELIVERIES : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.deliveries : []);
    const notifs = typeof DEFAULT_NOTIFICATIONS !== 'undefined' ? DEFAULT_NOTIFICATIONS : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.notifications : []);

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(orgs));
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    localStorage.setItem(STORAGE_KEYS.DEMANDS, JSON.stringify(demands));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    localStorage.removeItem(STORAGE_KEYS.SIMULATION);
  },

  getUser() {
    const defaultU = typeof DEFAULT_USER !== 'undefined' ? DEFAULT_USER : { name: 'Admin User', role: 'admin', organization: 'Central Food Bank' };
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || defaultU;
    } catch(e) {
      return defaultU;
    }
  },

  setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getCurrentUser() {
    return this.getUser();
  },

  setCurrentUser(user) {
    this.setUser(user);
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  getOrganisations() {
    const defaultO = typeof DEFAULT_ORGANISATIONS !== 'undefined' ? DEFAULT_ORGANISATIONS : [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORGS)) || defaultO;
    } catch(e) {
      return defaultO;
    }
  },

  updateOrganisation(id, updates) {
    const orgs = this.getOrganisations().map(o => o.id === id ? { ...o, ...updates } : o);
    localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(orgs));
    return orgs;
  },

  getListings() {
    const defaultL = typeof DEFAULT_FOOD_LISTINGS !== 'undefined' ? DEFAULT_FOOD_LISTINGS : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.listings : []);
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS)) || defaultL;
    } catch(e) {
      return defaultL;
    }
  },

  saveListings(listings) {
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  },

  addListing(listing) {
    const listings = this.getListings();
    listings.unshift(listing);
    this.saveListings(listings);
  },

  updateListing(id, updates) {
    const listings = this.getListings().map(l => l.id === id ? { ...l, ...updates } : l);
    this.saveListings(listings);
    return listings;
  },

  getDemands() {
    const defaultD = typeof DEFAULT_DEMANDS !== 'undefined' ? DEFAULT_DEMANDS : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.demand : []);
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEMANDS)) || defaultD;
    } catch(e) {
      return defaultD;
    }
  },

  getDemand() {
    return this.getDemands();
  },

  saveDemands(demands) {
    localStorage.setItem(STORAGE_KEYS.DEMANDS, JSON.stringify(demands));
  },

  saveDemand(demands) {
    this.saveDemands(demands);
  },

  addDemand(demand) {
    const demands = this.getDemands();
    demands.unshift(demand);
    this.saveDemands(demands);
  },

  updateDemand(id, updates) {
    const demands = this.getDemands().map(d => d.id === id ? { ...d, ...updates } : d);
    this.saveDemands(demands);
    return demands;
  },

  getDrivers() {
    const defaultDr = typeof DEFAULT_DRIVERS !== 'undefined' ? DEFAULT_DRIVERS : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.drivers : []);
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DRIVERS)) || defaultDr;
    } catch(e) {
      return defaultDr;
    }
  },

  saveDrivers(drivers) {
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
  },

  getDeliveries() {
    const defaultDel = typeof DEFAULT_DELIVERIES !== 'undefined' ? DEFAULT_DELIVERIES : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.deliveries : []);
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DELIVERIES)) || defaultDel;
    } catch(e) {
      return defaultDel;
    }
  },

  saveDeliveries(deliveries) {
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
  },

  addDelivery(delivery) {
    const deliveries = this.getDeliveries();
    deliveries.unshift(delivery);
    this.saveDeliveries(deliveries);
  },

  updateDelivery(id, updates) {
    const deliveries = this.getDeliveries().map(d => d.id === id ? { ...d, ...updates } : d);
    this.saveDeliveries(deliveries);
    return deliveries;
  },

  getNotifications() {
    const defaultN = typeof DEFAULT_NOTIFICATIONS !== 'undefined' ? DEFAULT_NOTIFICATIONS : (typeof DEMO_DATA !== 'undefined' ? DEMO_DATA.notifications : []);
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || defaultN;
    } catch(e) {
      return defaultN;
    }
  },

  markNotificationRead(id) {
    const notifs = this.getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  markAllNotificationsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  exportJson() {
    const data = {
      user: this.getUser(),
      organisations: this.getOrganisations(),
      listings: this.getListings(),
      demands: this.getDemands(),
      deliveries: this.getDeliveries(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodresq-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Initialize immediately upon script load
StorageManager.init();
