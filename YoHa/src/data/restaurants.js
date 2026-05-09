/** Pools d’images Unsplash par famille de cuisine — sélection déterministe par id */

function hash(id) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i);
  return Math.abs(h);
}

const IMG = {
  pizza: {
    covers: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&q=80&auto=format&fit=crop',
    ],
  },
  tacos: {
    covers: [
      'https://images.unsplash.com/photo-1599974579688-8dbdd035bcf7?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1599974579688-8dbdd035bcf7?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1599974579688-8dbdd035bcf7?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80&auto=format&fit=crop',
    ],
  },
  kebab: {
    covers: [
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80&auto=format&fit=crop',
    ],
  },
  sushi: {
    covers: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&q=80&auto=format&fit=crop',
    ],
  },
  burger: {
    covers: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1606131731446-5568d87113aa?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80&auto=format&fit=crop',
    ],
  },
  healthy: {
    covers: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=400&q=80&auto=format&fit=crop',
    ],
  },
  asian: {
    covers: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1570707253266-46969cd0ce86?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400&q=80&auto=format&fit=crop',
    ],
  },
  medical: {
    covers: [
      'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1559847844-5315695dadae?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80&auto=format&fit=crop',
    ],
  },
  dessert: {
    covers: [
      'https://images.unsplash.com/photo-1550617931-e01a7bef0185?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550617931-e01a7bef0185?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80&auto=format&fit=crop',
    ],
  },
  drinks: {
    covers: [
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=1200&q=80&auto=format&fit=crop',
    ],
    logos: [
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=160&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=160&q=80&auto=format&fit=crop',
    ],
    dishes: [
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80&auto=format&fit=crop',
    ],
  },
};

const ETA = {
  pizza: '15-28 min',
  tacos: '18-30 min',
  kebab: '16-28 min',
  sushi: '22-38 min',
  burger: '18-32 min',
  healthy: '12-22 min',
  asian: '18-30 min',
  medical: '12-26 min',
  dessert: '10-22 min',
  drinks: '12-25 min',
};

const DESC_HINT = {
  pizza: 'Pizza artisanale, ingrédients frais, cuisson au four.',
  tacos: 'Tacos faits maison, sauces maison, street food.',
  kebab: 'Viandes marinées, pains du jour, sauces signature.',
  sushi: 'Poisson frais, riz vinaigré, créations du chef.',
  burger: 'Steaks smash ou grillés, buns briochés, frites maison.',
  healthy: 'Bowls et salades équilibrés, options végan.',
  asian: 'Wok, nouilles et saveurs d’Asie.',
  medical: 'Menus validés nutrition, adaptés hôpital & récupération.',
  dessert: 'Pâtisserie et douceurs du jour.',
  drinks: 'Boissons, jus frais et café.',
};


function buildMenu(id, cuisine, h) {
  const pool = IMG[cuisine] || IMG.pizza;
  const d = (i) => pool.dishes[(h + i) % pool.dishes.length];
  const mk = (suffix, name, price, desc, i) => ({
    id: `${id}-${suffix}`,
    name,
    price: price * 10,
    desc,
    img: d(i),
  });

  const starters = {
    pizza: [
      mk('m1', 'Margherita', 8.9, 'Tomate, mozzarella, basilic', 0),
      mk('m2', 'Speciale maison', 11.5, 'Fromages, charcuterie, roquette', 1),
      mk('m3', 'Quatre saisons', 12.9, 'Champignons, artichauts, jambon', 2),
    ],
    tacos: [
      mk('m1', 'Tacos poulet', 7.9, 'Fromage, sauce algérienne', 0),
      mk('m2', 'Tacos viande hachée', 8.5, 'Double viande, frites', 1),
      mk('m3', 'Tacos mixte XL', 10.9, 'Mix viandes, sauce fromagère', 2),
    ],
    kebab: [
      mk('m1', 'Assiette kebab', 8.5, 'Viande, frites, salade', 0),
      mk('m2', 'Durum fromager', 7.9, 'Wrap grillé, sauce au choix', 1),
      mk('m3', 'Menu royal', 11.9, 'Kebab, boisson, dessert', 2),
    ],
    sushi: [
      mk('m1', 'Plateau 12 pièces', 18.9, 'Mix sashimi & maki', 0),
      mk('m2', 'California roll', 9.9, 'Avocat, surimi, sésame', 1),
      mk('m3', 'Brochettes yakitori', 8.5, 'Poulet teriyaki', 2),
    ],
    burger: [
      mk('m1', 'Classic burger', 9.9, 'Steak, cheddar, sauce maison', 0),
      mk('m2', 'Double smash', 12.5, 'Double steak, bacon', 1),
      mk('m3', 'Veggie burger', 9.5, 'Steak végétal, avocat', 2),
    ],
    healthy: [
      mk('m1', 'Bowl quinoa', 9.5, 'Légumes grillés, houmous', 0),
      mk('m2', 'Salade César', 8.9, 'Poulet, parmesan', 1),
      mk('m3', 'Poke bowl', 12.9, 'Saumon, edamame, mangue', 2),
    ],
    asian: [
      mk('m1', 'Pad thaï', 9.5, 'Nouilles, cacahuètes, citron', 0),
      mk('m2', 'Ramen tonkotsu', 11.5, 'Chashu, œuf mollet', 1),
      mk('m3', 'Nems croustillants', 5.9, '6 pièces, sauce nuoc-mâm', 2),
    ],
    medical: [
      mk('m1', 'Plat protéiné', 10.9, 'Poulet vapeur, légumes', 0),
      mk('m2', 'Soupe récupération', 6.9, 'Bouillon, légumes', 1),
      mk('m3', 'Bowl IG bas', 9.9, 'Quinoa, légumes verts', 2),
    ],
    dessert: [
      mk('m1', 'Tarte du jour', 4.5, 'Pâtisserie maison', 0),
      mk('m2', 'Éclair café', 4.9, 'Crème café', 1),
      mk('m3', 'Tiramisu', 5.5, 'Mascarpone, cacao', 2),
    ],
    drinks: [
      mk('m1', 'Smoothie détox', 5.5, 'Fruits frais', 0),
      mk('m2', 'Latte glacé', 4.5, 'Espresso, lait', 1),
      mk('m3', 'Thé glacé maison', 3.9, 'Menthe, citron', 2),
    ],
  };

  const row = starters[cuisine] || starters.pizza;

  return [
    { category: '⭐ Les plus commandés', items: row },
    {
      category: '🥤 Pour accompagner',
      items: [
        mk('d1', 'Boisson 33 cl', 2.5, 'Au choix', 0),
        mk('d2', 'Eau minérale', 1.5, '50 cl', 1),
      ],
    },
  ];
}

export function makeRestaurant(id, name, cuisine, tags, distance, promo) {
  const h = hash(id);
  const pool = IMG[cuisine] || IMG.pizza;
  const cover = pool.covers[h % pool.covers.length];
  const logo = pool.logos[h % pool.logos.length];
  const rating = Math.round((4.5 + (h % 45) / 100) * 10) / 10;
  const reviews = 220 + (h % 2800);

  return {
    id,
    name,
    cuisine,
    tags,
    rating,
    reviews,
    eta: ETA[cuisine] || '15-28 min',
    fee: 'Livraison offerte',
    distance,
    promo,
    cover,
    logo,
    description: `${name} — ${DESC_HINT[cuisine] || DESC_HINT.pizza}`,
    menu: buildMenu(id, cuisine, h),
  };
}

export const RESTAURANTS = [
  makeRestaurant('pizza-detroit-tanger', 'Pizza Detroit Tanger', 'pizza', ['Pizza', 'Fast food'], '6,2 km', 'Top ventes'),
  makeRestaurant('new-school-tacos-tanger', 'New School Tacos Tanger', 'tacos', ['Tacos', 'Fast food'], '9,1 km', 'Menu étudiant'),
  makeRestaurant('bomos-kebab', "Bomo's Kebab", 'kebab', ['Kebab', 'Street food'], '7,5 km', 'Saveurs Berlin style'),
  makeRestaurant('soju-sushi-tanger', 'Soju Sushi Tanger', 'sushi', ['Sushi', 'Asian'], '2,4 km', 'Menu deluxe'),
  makeRestaurant('the-burger-boutique', 'The Burger Boutique', 'burger', ['Burgers', 'Premium'], '7,9 km', 'Menu complet'),
  makeRestaurant('pizza-palace', 'Pizza Palace', 'pizza', ['Pizza', 'Italien'], '5,6 km', '-20% première commande'),
  makeRestaurant('healthy-bowl', 'Healthy Bowl', 'healthy', ['Healthy', 'Vegan'], '4,4 km', 'Exclu campus'),
  makeRestaurant('burger-lab', 'Burger Lab', 'burger', ['Burger', 'Smash'], '3,1 km', 'Frites offertes'),
  makeRestaurant('sushi-zen', 'Sushi Zen', 'sushi', ['Sushi', 'Japonais'], '6,4 km', 'Soupe offerte'),
  makeRestaurant('medeat', 'MedEat', 'medical', ['Hôpital', 'Diététique'], '4,2 km', 'Partenaire hôpital'),
  makeRestaurant('asian-wok', 'Asian Wok', 'asian', ['Asiatique', 'Wok'], '5,9 km', 'Nems offerts'),
  makeRestaurant('pizza-hub-tanger', 'Pizza Hub Tanger', 'pizza', ['Pizza', 'Rapide'], '7,0 km', 'Livraison rapide'),
  makeRestaurant('tacos-factory-tanger', 'Tacos Factory Tanger', 'tacos', ['Tacos', 'Street food'], '6,7 km', 'Combo étudiant'),
  makeRestaurant('kebab-station-tanger', 'Kebab Station Tanger', 'kebab', ['Kebab', 'Turc'], '2,3 km', 'Best seller'),
  makeRestaurant('sushi-time-tanger', 'Sushi Time Tanger', 'sushi', ['Sushi', 'Fresh'], '2,7 km', 'Promo midi'),
  makeRestaurant('burger-house-tanger', 'Burger House Tanger', 'burger', ['Burger', 'Grill'], '5,9 km', 'Double deal'),
  makeRestaurant('green-bites', 'Green Bites', 'healthy', ['Healthy', 'Salades'], '4,3 km', 'Détox week'),
  makeRestaurant('thai-box', 'Thai Box', 'asian', ['Thaï', 'Nouilles'], '2,2 km', 'Wok minute'),
  makeRestaurant('clinic-fuel', 'Clinic Fuel', 'medical', ['Nutrition', 'Équilibré'], '6,5 km', 'Menu santé'),
  makeRestaurant('sweet-cloud', 'Sweet Cloud', 'dessert', ['Dessert', 'Pâtisserie'], '5,5 km', '2+1 offert'),
  makeRestaurant('drink-zone', 'Drink Zone', 'drinks', ['Boissons', 'Coffee'], '9,8 km', 'Happy hour'),
  makeRestaurant('pizza-lab-marina', 'Pizza Lab Marina', 'pizza', ['Pizza', 'Artisanale'], '2,8 km', 'Four bois'),
  makeRestaurant('taco-corner-malta', 'Taco Corner Malta', 'tacos', ['Tacos', 'TexMex'], '3,0 km', 'Sauce signature'),
  makeRestaurant('doner-avenue', 'Doner Avenue', 'kebab', ['Kebab', 'Durum'], '5,6 km', 'Portion XL'),
  makeRestaurant('maki-house', 'Maki House', 'sushi', ['Maki', 'Sushi'], '5,9 km', 'Nouveau menu'),
  makeRestaurant('smash-city', 'Smash City', 'burger', ['Burger', 'Smash'], '5,6 km', 'Promo duo'),
  makeRestaurant('vital-bowl', 'Vital Bowl', 'healthy', ['Healthy', 'Fit'], '5,4 km', 'Pack sport'),
  makeRestaurant('ramen-yard', 'Ramen Yard', 'asian', ['Ramen', 'Asiatique'], '2,5 km', 'Spicy week'),
  makeRestaurant('care-kitchen', 'Care Kitchen', 'medical', ['Santé', 'Protéiné'], '7,4 km', 'Option sans sel'),
  makeRestaurant('fresh-sips', 'Fresh Sips', 'drinks', ['Smoothies', 'Jus'], '5,9 km', 'Boisson offerte'),
  {
    id: 'pharmacie-campus',
    name: 'Pharmacie du Campus',
    cuisine: 'pharmacy',
    tags: ['Pharmacie', 'Parapharmacie', 'Santé'],
    rating: 4.8,
    reviews: 420,
    eta: '12-22 min',
    fee: 'Livraison offerte',
    distance: '0,3 km',
    promo: 'Ordonnances & conseils',
    cover: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80&auto=format&fit=crop',
    logo: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=160&q=80&auto=format&fit=crop',
    description: 'Parapharmacie et services pharmaceutiques pour le campus et le CHU — livraison discrète.',
    menu: [
      {
        category: '💊 Santé',
        items: [
          {
            id: 'pc1',
            name: 'Kit premiers soins',
            price: 249,
            desc: 'Pansements, antiseptique, compresses',
            img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80&auto=format&fit=crop',
          },
          {
            id: 'pc2',
            name: 'Vitamines C & D',
            price: 125,
            desc: 'Compléments alimentaires',
            img: 'https://images.unsplash.com/photo-1550572017-edd951aa9f34?w=400&q=80&auto=format&fit=crop',
          },
        ],
      },
      {
        category: '✨ Hygiène',
        items: [
          {
            id: 'pc3',
            name: 'Gel hydroalcoolique',
            price: 49,
            desc: 'Format poche 100 ml',
            img: 'https://images.unsplash.com/photo-1584714268709-c8dd73027192?w=400&q=80&auto=format&fit=crop',
          },
        ],
      },
    ],
  },
];
