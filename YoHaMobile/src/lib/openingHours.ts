/** Horaires — aligné sur backend/apps/restaurants/opening_hours.py */

export const OPENING_DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const OPENING_DAY_LABELS: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const DEFAULT_SLOT = { is_closed: false, is_24h: false, open: '10:00', close: '23:00' };
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type DayHours = {
  is_closed: boolean;
  is_24h?: boolean;
  open: string;
  close: string;
};
export type OpeningHoursMap = Record<string, DayHours>;

export function defaultOpeningHours(): OpeningHoursMap {
  return Object.fromEntries(OPENING_DAY_KEYS.map((day) => [day, { ...DEFAULT_SLOT }]));
}

export function normalizeOpeningHours(raw: unknown): OpeningHoursMap {
  const base = defaultOpeningHours();
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base };
  for (const day of OPENING_DAY_KEYS) {
    const slot = (raw as Record<string, DayHours>)[day];
    if (!slot || typeof slot !== 'object') continue;
    const open = String(slot.open || DEFAULT_SLOT.open).slice(0, 5);
    const close = String(slot.close || DEFAULT_SLOT.close).slice(0, 5);
    const is_closed = Boolean(slot.is_closed);
    const is_24h = Boolean(slot.is_24h) || (!is_closed && open === close);
    out[day] = {
      is_closed,
      is_24h: is_24h && !is_closed,
      open: is_24h && !is_closed ? '00:00' : (TIME_RE.test(open) ? open : DEFAULT_SLOT.open),
      close: is_24h && !is_closed ? '00:00' : (TIME_RE.test(close) ? close : DEFAULT_SLOT.close),
    };
  }
  return out;
}

function parseMinutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function isOpenAtTime(open: string, close: string, nowMinutes: number, is24h = false) {
  if (is24h || open === close) return true;
  const openM = parseMinutes(open);
  const closeM = parseMinutes(close);
  if (openM < closeM) return nowMinutes >= openM && nowMinutes < closeM;
  return nowMinutes >= openM || nowMinutes < closeM;
}

function jsWeekdayToKey(date: Date) {
  const js = date.getDay();
  const idx = js === 0 ? 6 : js - 1;
  return OPENING_DAY_KEYS[idx];
}

export function isRestaurantOpen(openingHours: OpeningHoursMap | undefined, at = new Date()) {
  const hours = normalizeOpeningHours(openingHours);
  const key = jsWeekdayToKey(at);
  const day = hours[key];
  if (day.is_closed) return false;
  const nowMinutes = at.getHours() * 60 + at.getMinutes();
  return isOpenAtTime(day.open, day.close, nowMinutes, day.is_24h);
}

function nextOpenLabel(hours: OpeningHoursMap, at: Date) {
  const startMinutes = at.getHours() * 60 + at.getMinutes();
  const startJs = at.getDay();
  const startIdx = startJs === 0 ? 6 : startJs - 1;

  for (let offset = 0; offset < 8; offset += 1) {
    const idx = (startIdx + offset) % 7;
    const key = OPENING_DAY_KEYS[idx];
    const slot = hours[key];
    if (slot.is_closed) continue;
    if (offset === 0) {
      if (isOpenAtTime(slot.open, slot.close, startMinutes, slot.is_24h)) return 'Ouvert';
      if (!slot.is_24h && startMinutes < parseMinutes(slot.open)) {
        return `Fermé · ouvre à ${slot.open}`;
      }
      continue;
    }
    const dayLabel = offset === 1 ? 'demain' : OPENING_DAY_LABELS[key].toLowerCase();
    return `Fermé · ouvre ${dayLabel} à ${slot.open}`;
  }
  return 'Fermé';
}

export function restaurantOpenStatus(openingHours: OpeningHoursMap | undefined, at = new Date()) {
  const hours = normalizeOpeningHours(openingHours);
  const isOpen = isRestaurantOpen(hours, at);
  return {
    isOpen,
    openLabel: isOpen ? 'Ouvert' : nextOpenLabel(hours, at),
  };
}

export function hasAnyRestaurantOpen(
  restaurants: Array<{ isOpen?: boolean; openingHours?: OpeningHoursMap }> | undefined,
  at = new Date(),
) {
  if (!Array.isArray(restaurants) || restaurants.length === 0) return false;
  return restaurants.some((r) => {
    if (typeof r.isOpen === 'boolean') return r.isOpen;
    return isRestaurantOpen(r.openingHours, at);
  });
}

export function formatDayHours(slot?: DayHours) {
  if (!slot || slot.is_closed) return 'Fermé';
  if (slot.is_24h || slot.open === slot.close) return '24h/24';
  return `${slot.open} – ${slot.close}`;
}
