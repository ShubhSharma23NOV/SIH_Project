/**
 * Icon Constants - ArogyaJal Design System
 * Semantic naming system for MaterialCommunityIcons
 * Makes it easy to find and use icons without memorizing exact names
 */

export const ICONS = {
  // ==========================================
  // WATER & SAFETY (18 icons)
  // ==========================================
  water: 'water',
  waterDrop: 'water',
  waterSafe: 'water-check',
  waterUnsafe: 'water-alert',
  waterTest: 'test-tube',
  waterPump: 'water-pump',
  waterTank: 'water-outline',
  waterBoil: 'fire',
  waterBottle: 'bottle-tonic',
  waterWell: 'water-well',
  waterFilter: 'filter',
  waterQuality: 'water-percent',
  waterSource: 'water-pump-off',
  waterContaminated: 'water-remove',
  waterClean: 'water-check',
  waterLevel: 'waves',
  bluetooth: 'bluetooth',
  next: 'chevron-right',

  // ==========================================
  // HEALTH & MEDICAL (7 icons)
  // ==========================================
  health: 'heart-pulse',
  medicine: 'pill',
  doctor: 'doctor',
  hospital: 'hospital-box',
  firstAid: 'medical-bag',
  thermometer: 'thermometer',
  stethoscope: 'stethoscope',

  // ==========================================
  // SYMPTOMS (5 icons)
  // ==========================================
  stomach: 'stomach',
  vomit: 'emoticon-sick',
  fever: 'thermometer-alert',
  cough: 'lungs',
  headache: 'head-alert',

  // ==========================================
  // ACTIONS (15 icons)
  // ==========================================
  report: 'file-document-edit',
  camera: 'camera',
  location: 'map-marker',
  phone: 'phone',
  emergency: 'phone-alert',
  alert: 'alert-circle',
  download: 'download',
  share: 'share-variant',
  upload: 'upload',
  save: 'content-save',
  edit: 'pencil',
  delete: 'delete',
  search: 'magnify',
  filter: 'filter-variant',
  sort: 'sort',

  // ==========================================
  // COMMUNITY (7 icons)
  // ==========================================
  community: 'account-group',
  family: 'home-account',
  village: 'home-group',
  school: 'school',
  government: 'bank',
  person: 'account',
  people: 'account-multiple',

  // ==========================================
  // STATUS & INDICATORS (9 icons)
  // ==========================================
  success: 'check-circle',
  checkCircle: 'check-circle',
  warning: 'alert',
  danger: 'alert-octagon',
  info: 'information',
  pending: 'clock-outline',
  completed: 'check-circle-outline',
  inProgress: 'progress-clock',
  cancelled: 'close-circle',

  // ==========================================
  // NAVIGATION (13 icons)
  // ==========================================
  home: 'home',
  back: 'arrow-left',
  forward: 'arrow-right',
  menu: 'menu',
  close: 'close',
  add: 'plus',
  checkmark: 'check',
  refresh: 'refresh',
  chevronRight: 'chevron-right',
  chevronLeft: 'chevron-left',
  chevronUp: 'chevron-up',
  chevronDown: 'chevron-down',
  moreVertical: 'dots-vertical',

  // ==========================================
  // UTILITIES (7 icons)
  // ==========================================
  calendar: 'calendar',
  sync: 'sync',
  offline: 'cloud-off-outline',
  language: 'translate',
  settings: 'cog',
  help: 'help-circle',
  flash: 'flash',

  // ==========================================
  // DASHBOARD SPECIFIC
  // ==========================================
  dashboard: 'view-dashboard',
  statistics: 'chart-bar',
  map: 'map',
  heatmap: 'map-marker-radius',
  document: 'file-document',
  checklist: 'clipboard-check',
  shield: 'shield-check',
  user: 'account-circle',
  logout: 'logout',
  login: 'login',

  // ==========================================
  // AYURVEDIC & REMEDIES
  // ==========================================
  ayurveda: 'leaf',
  herbs: 'flower',
  remedy: 'bottle-tonic-plus',
  natural: 'nature',
  plant: 'sprout',

  // ==========================================
  // EMERGENCY & ALERTS
  // ==========================================
  ambulance: 'ambulance',
  siren: 'alarm-light',
  sos: 'alert-decagram',
  bell: 'bell-ring',
  notification: 'bell',

  // ==========================================
  // DATA & REPORTS
  // ==========================================
  chart: 'chart-line',
  graph: 'chart-areaspline',
  table: 'table',
  export: 'export',
  print: 'printer',
  pdf: 'file-pdf-box',

  // ==========================================
  // COMMUNICATION
  // ==========================================
  email: 'email',
  message: 'message-text',
  chat: 'chat',
  call: 'phone',
  video: 'video',

  // ==========================================
  // LOCATION & GPS
  // ==========================================
  gps: 'crosshairs-gps',
  mapMarker: 'map-marker',
  mapMarkerOff: 'map-marker-off',
  compass: 'compass',
  route: 'routes',

  // ==========================================
  // HOUSEHOLD & SURVEY
  // ==========================================
  house: 'home',
  household: 'home-account',
  survey: 'clipboard-text',
  form: 'form-select',
  questionnaire: 'clipboard-list',

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  lock: 'lock',
  unlock: 'lock-open',
  key: 'key',
  fingerprint: 'fingerprint',
  shield: 'shield-account',

  // ==========================================
  // MEDIA
  // ==========================================
  image: 'image',
  gallery: 'image-multiple',
  video: 'video',
  audio: 'microphone',
  attachment: 'paperclip',

  // ==========================================
  // WEATHER & ENVIRONMENT
  // ==========================================
  sun: 'weather-sunny',
  rain: 'weather-rainy',
  cloud: 'weather-cloudy',
  temperature: 'thermometer',
  humidity: 'water-percent',

  // ==========================================
  // GOVERNMENT & OFFICIAL
  // ==========================================
  emblem: 'seal',
  flag: 'flag',
  certificate: 'certificate',
  badge: 'badge-account',
  stamp: 'stamp',
};

// Icon size presets
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Icon color presets (matches design system)
export const ICON_COLORS = {
  primary: '#0B4F93',    // Navy Blue
  secondary: '#3AAED8',  // Sky Blue
  accent: '#14b8a6',     // Teal
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Orange
  danger: '#EF4444',     // Red
  info: '#0EA5E9',       // Cyan
  neutral: '#6B7280',    // Gray
  white: '#FFFFFF',      // White
};

// Helper function to get icon name
export const getIconName = (semanticName) => {
  return ICONS[semanticName] || semanticName;
};

// Helper function to get icon size
export const getIconSize = (size) => {
  return typeof size === 'string' ? ICON_SIZES[size] : size;
};

// Helper function to get icon color
export const getIconColor = (color) => {
  return ICON_COLORS[color] || color;
};

export default ICONS;
