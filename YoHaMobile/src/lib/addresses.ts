export type AddressPreset = {
  id: string;
  label: string;
  detail: string;
  icon: string;
};

export const ADDRESS_PRESETS: AddressPreset[] = [
  { id: 'chu-urgences', label: 'Urgences CHU Tanger', detail: 'Pavillon des Urgences, RDC', icon: '🚨' },
  { id: 'chu-maternite', label: 'Maternité CHU Tanger', detail: 'Bâtiment Gynécologie, 1er Étage', icon: '👶' },
  { id: 'chu-rea', label: 'Réanimation CHU Tanger', detail: 'Bloc Réa, 2ème Étage', icon: '🏥' },
  { id: 'fmpt', label: 'FMPT Tanger', detail: 'Faculté de Médecine, Hall Principal', icon: '🎓' },
  { id: 'ispits', label: 'ISPITS Tanger', detail: 'Institut de Santé, Accueil Principal', icon: '🩺' },
  { id: 'residence-a', label: 'Résidence Alliance A', detail: 'Entrée A, Hall de Réception', icon: '🏠' },
  { id: 'residence-b', label: 'Résidence Alliance B', detail: 'Entrée B, Hall de Réception', icon: '🏠' },
];
