export const CATEGORY_GROUPS = [
  {
    group: "Fast Food",
    emoji: "🍕",
    id: "fast_food",
    items: [
      { label: 'Pizza',    image: '/pizza-img/section_4_04.webp', emoji: '🍕', id: 'pizza' },
      { label: 'Burger',   image: '/burger-img/df23088ac8117ca6618f0f5a4e8097679a10d00d.webp', emoji: '🍔', id: 'burger' },
      { label: 'Tacos',    image: '/pizza-img/section_1_01.webp', emoji: '🌮', id: 'tacos' },
      { label: 'Kebab',    image: '/pizza-img/section_1_02.webp', emoji: '🥙', id: 'kebab' },
      { label: 'Sandwich', image: '/pizza-img/section_1_03.webp', emoji: '🥪', id: 'sandwich' },
      { label: 'Wraps',    image: '/pizza-img/section_1_04.webp', emoji: '🌯', id: 'wraps' },
    ]
  },
  {
    group: "Grillades",
    emoji: "🍗",
    id: "grillades",
    items: [
      { label: 'Grillades & BBQ', image: '/burger-img/e9085d20d65a0e133bb8046f9a4d28fd14db20db.webp', emoji: '🍗', id: 'grillades' },
      { label: 'Poulet rôti',     image: '/burger-img/ed38bda4a96c7db895cb78d8546f1b69d0ef63b6.webp', emoji: '🍖', id: 'poulet' },
      { label: 'Brochettes',      image: '/burger-img/59a30f6856d3593745e60a2c89023d6579bd321f.webp', emoji: '🥩', id: 'steak' },
    ]
  },
  {
    group: "Cuisine du monde",
    emoji: "🍣",
    id: "world",
    items: [
      { label: 'Sushi',     image: '/pizza-img/section_1_07.webp', emoji: '🍣', id: 'sushi' },
      { label: 'Asiatique', image: '/pizza-img/section_1_08.webp', emoji: '🍜', id: 'asian' },
      { label: 'Italien',   image: '/pizza-img/section_4_03.webp', emoji: '🍝', id: 'italien' },
      { label: 'Mexicain',  image: '/pizza-img/section_1_09.webp', emoji: '🌶️', id: 'mexicain' },
    ]
  },
  {
    group: "Healthy",
    emoji: "🥗",
    id: "healthy_group",
    items: [
      { label: 'Healthy', image: '/pizza-img/section_1_05.webp', emoji: '🥗', id: 'healthy' },
      { label: 'Salades & Bowls', image: '/pizza-img/section_1_06.webp', emoji: '🥑', id: 'salad' },
    ]
  },
  {
    group: "Petit-déjeuner & Café",
    emoji: "☕",
    id: "breakfast",
    items: [
      { label: 'Petit-déjeuner', image: '/pizza-img/section_2_01.webp', emoji: '☕', id: 'breakfast' },
      { label: 'Crêpes & Gaufres', image: '/pizza-img/section_2_02.webp', emoji: '🥞', id: 'crepes' },
    ]
  },
  {
    group: "Sucré",
    emoji: "🍰",
    id: "sweet",
    items: [
      { label: 'Pâtisserie & Gâteaux', image: '/media/restaurants/custom-patisserie.webp', emoji: '🍰', id: 'dessert' },
      { label: 'Glaces',              image: '/pizza-img/section_2_05.webp', emoji: '🍦', id: 'glaces' },
      { label: 'Donuts & Cookies',    image: '/pizza-img/section_2_06.webp', emoji: '🍩', id: 'donuts' },
    ]
  },
  {
    group: "Boissons",
    emoji: "🧋",
    id: "drinks_group",
    items: [
      { label: 'Jus & Smoothies', image: '/pizza-img/section_2_07.webp', emoji: '🥤', id: 'drinks' },
      { label: 'Bubble Tea',      image: '/pizza-img/section_2_08.webp', emoji: '🧋', id: 'bubbletea' },
    ]
  },
  {
    group: "Courses",
    emoji: "🛒",
    id: "services_group",
    items: [
      { label: 'Pharmacie',   image: '/media/restaurants/custom-pharmacy.webp', emoji: '💊', id: 'pharmacy' },
      { label: 'Parapharma',  image: '/media/restaurants/custom-parapharmacy.webp', emoji: '🌿', id: 'parapharmacy' },
      { label: 'Supermarché', image: '/media/restaurants/custom-supermarket.webp', emoji: '🛒', id: 'supermarket' },
      { label: 'Magasins',    image: '/media/restaurants/custom-shop.webp', emoji: '🛍️', id: 'shop' },
    ]
  }
];

export const CATEGORIES_BANNERS = CATEGORY_GROUPS.flatMap(g => g.items);
