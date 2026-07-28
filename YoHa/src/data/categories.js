export const CATEGORY_GROUPS = [
  {
    group: "Fast Food",
    emoji: "🍕",
    id: "fast_food",
    items: [
      { label: 'Pizza',    image: '/categories/cat_pizza.jpg', emoji: '🍕', id: 'pizza' },
      { label: 'Burger',   image: '/categories/cat_burger.jpg', emoji: '🍔', id: 'burger' },
      { label: 'Tacos',    image: '/categories/cat_tacos.jpg', emoji: '🌮', id: 'tacos' },
      { label: 'Kebab',    image: '/categories/cat_kebab.jpg', emoji: '🥙', id: 'kebab' },
      { label: 'Sandwich', image: '/categories/cat_tacos.jpg', emoji: '🥪', id: 'sandwich' },
      { label: 'Wraps',    image: '/categories/cat_tacos.jpg', emoji: '🌯', id: 'wraps' },
    ]
  },
  {
    group: "Grillades",
    emoji: "🍗",
    id: "grillades",
    items: [
      { label: 'Grillades',       image: '/categories/cat_chicken.jpg', emoji: '🍗', id: 'grillades' },
      { label: 'Poulet rôti',     image: '/categories/cat_chicken.jpg', emoji: '🍖', id: 'poulet' },
      { label: 'Brochettes',      image: '/categories/cat_kebab.jpg', emoji: '🥩', id: 'steak' },
    ]
  },
  {
    group: "Cuisine du monde",
    emoji: "🍣",
    id: "world",
    items: [
      { label: 'Sushi',     image: '/categories/cat_sushi.jpg', emoji: '🍣', id: 'sushi' },
      { label: 'Asiatique', image: '/categories/cat_sushi.jpg', emoji: '🍜', id: 'asian' },
      { label: 'Italien',   image: '/categories/cat_pizza.jpg', emoji: '🍝', id: 'italien' },
      { label: 'Mexicain',  image: '/categories/cat_tacos.jpg', emoji: '🌶️', id: 'mexicain' },
    ]
  },
  {
    group: "Healthy",
    emoji: "🥗",
    id: "healthy_group",
    items: [
      { label: 'Healthy', image: '/categories/cat_healthy.jpg', emoji: '🥗', id: 'healthy' },
      { label: 'Salades & Bowls', image: '/categories/cat_healthy.jpg', emoji: '🥑', id: 'salad' },
    ]
  },
  {
    group: "Petit-déjeuner & Café",
    emoji: "☕",
    id: "breakfast",
    items: [
      { label: 'Petit-déjeuner', image: '/categories/cat_patisserie.jpg', emoji: '☕', id: 'breakfast' },
      { label: 'Crêpes & Gaufres', image: '/categories/cat_patisserie.jpg', emoji: '🥞', id: 'crepes' },
    ]
  },
  {
    group: "Sucré",
    emoji: "🍰",
    id: "sweet",
    items: [
      { label: 'Pâtisserie', image: '/categories/cat_patisserie.jpg', emoji: '🍰', id: 'dessert' },
      { label: 'Glaces',      image: '/categories/cat_patisserie.jpg', emoji: '🍦', id: 'glaces' },
      { label: 'Donuts',      image: '/categories/cat_patisserie.jpg', emoji: '🍩', id: 'donuts' },
    ]
  },
  {
    group: "Boissons",
    emoji: "🧋",
    id: "drinks_group",
    items: [
      { label: 'Jus & Smoothies', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=85', emoji: '🥤', id: 'drinks' },
      { label: 'Bubble Tea',      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=85', emoji: '🧋', id: 'bubbletea' },
    ]
  },
  {
    group: "Courses",
    emoji: "🛒",
    id: "services_group",
    items: [
      { label: 'Pharmacie',   image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&auto=format&fit=crop&q=85', emoji: '💊', id: 'pharmacy' },
      { label: 'Parapharma',  image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=85', emoji: '🌿', id: 'parapharmacy' },
      { label: 'Supermarché', image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=85', emoji: '🛒', id: 'supermarket' },
      { label: 'Magasins',    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=85', emoji: '🛍️', id: 'shop' },
    ]
  }
];

export const CATEGORIES_BANNERS = CATEGORY_GROUPS.flatMap(g => g.items);
