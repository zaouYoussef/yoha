export type AddressPreset = {
  id: string;
  label: string;
  detail: string;
  icon: string;
};

export const ADDRESS_PRESETS: AddressPreset[] = [
  { id: 'chu', label: 'CHU-Tanger', detail: 'Centre hospitalier universitaire', icon: '🏥' },
  { id: 'chu-etage', label: 'CHU — Étage / Service', detail: 'Précisez le bâtiment et l’étage', icon: '🏢' },
  { id: 'campus', label: 'Campus universitaire', detail: 'Faculté, résidence, amphithéâtre…', icon: '🎓' },
  { id: 'custom', label: 'Autre adresse', detail: 'Quartier, rue, repère…', icon: '📍' },
];
