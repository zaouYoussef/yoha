/**
 * Trois familles, trois rôles.
 *
 * - display : Big Shoulders Display — condensé, capitales, éditorial.
 *   C'est la voix de la marque. Jamais en dessous de 20 px.
 * - corps   : Archivo — grotesque neutre, très lisible en petit.
 * - mono    : DM Mono — prix, minutes, quantités. Les chiffres s'alignent
 *   en colonne quand on empile des lignes de panier.
 *
 * Installation :
 *   npx expo install @expo-google-fonts/big-shoulders-display \
 *     @expo-google-fonts/archivo @expo-google-fonts/dm-mono
 */
export const fonts = {
  /* display */
  display: 'BigShouldersDisplay_800ExtraBold',
  displayBlack: 'BigShouldersDisplay_900Black',
  displayBold: 'BigShouldersDisplay_700Bold',

  /* corps */
  body: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_700Bold',

  /* chiffres */
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
};
