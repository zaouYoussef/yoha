"""Seed du restaurant « Pizzeria Les Amis » (menu complet, photos)."""
from decimal import Decimal

from django.db import migrations

SLUG = "pizzeria-les-amis"
MEDIA_BASE = "/media/restaurants/pizzeria-les-amis"
COVER_URL = f"{MEDIA_BASE}/cover.webp"
CHAWARMA_URL = f"{MEDIA_BASE}/chawarma.webp"

_U = "https://images.unsplash.com/photo-{id}?w=800&auto=format&fit=crop&q=80"


def img(pid):
    return _U.format(id=pid)


# ——— Photos Unsplash (IDs déjà utilisés ailleurs dans le projet / stables) ———
PIZZAS = [
    "1565299624946-b28f40a0ae38",
    "1513104890138-7c749659a591",
    "1574071318508-1cdbab80d002",
    "1628840042765-356cda07504e",
    "1593560708920-61dd98c46a4e",
    "1604382354936-07c5d9983bd3",
    "1625944037004-6e7418d493fd",
    "1604917879764-2d0192ddd1a8",
]
SALADS = [
    "1546069901-ba9599a7e63c",
    "1512621776951-a57141f2eefd",
    "1546069901-d5bfd2cbfb1f",
    "1488477181946-6428a0291777",
]
KEBABS = [
    "1603360946369-dc9bb6258143",
    "1544025162-d76694265947",
    "1555939594-58d7cb561ad1",
]
BURGERS = [
    "1568901346375-23c9450c58cd",
    "1571091655789-405eb7a3a3a8",
    "1551782450-a2132b4ba21d",
    "1565299507177-b0ac66763828",
]
SANDWICH = "1528735602780-2552fd46c7af"
PASTA = "1551183053-bf91a1d81141"
SEAFOOD_PASTA = "1563379926897-05f4575a45d8"
SOUP = "1547592166-23ac45744acd"
SHRIMP = "1559744814-1354976d69cd"
OMELETTE = "1533089860892-a7c6f0a88666"
TEA = "1544787219-7f47ccb76574"
CAN = "1556679343-c7306c1976bc"
JUICE = "1551024709-8f23befc6f87"
ORANGE_JUICE = "1437418747212-8d9709af5133"
ENERGY = "1580906607166-4aa7acfe97d7"
WATER = "1548839140-29a749e1cf4d"
MIXED_DRINK = "1573080496219-bb080dd4f877"
CRÈME = "1565958011703-44f9829ba187"
DONUTS = "1578985545062-69928b1d9587"
FRUIT_SALAD = "1567325218913-8e0cfad0a100"

MENU = [
    (
        "🥗 LES ENTRÉES FROIDES",
        [
            ("f1", "Salade Marocaine", "20.00", img(SALADS[0]), ""),
            ("f2", "Salade Niçoise", "25.00", img(SALADS[1]), ""),
            ("f3", "Salade d'Avocat aux Vinaigrette", "25.00", img(SALADS[2]), ""),
            ("f4", "Salade d'Avocat aux Crevettes", "40.00", img(SALADS[3]), ""),
            ("f5", "Salade Les Amis Individuelle", "20.00", img(SALADS[0]), "La spécialité de la maison, version individuelle."),
            ("f6", "Salade Les Amis Individuelle + Poulet", "25.00", img(SALADS[1]), "La spécialité de la maison avec filet de poulet grillé."),
            ("f7", "Salade Les Amis 2 Personnes", "40.00", img(SALADS[2]), "La spécialité de la maison, pour deux personnes."),
            ("f8", "Salade Les Amis 2 Personnes + Poulet", "50.00", img(SALADS[3]), "La spécialité de la maison pour deux, avec poulet."),
        ],
    ),
    (
        "🥪 SANDWICHS",
        [
            ("s1", "Chawarma Poulet", "25.00", CHAWARMA_URL, "Poulet mariné, pain chawarma, crudités et sauce maison."),
            ("s2", "Chawarma Poulet au Plat", "30.00", CHAWARMA_URL, "Servi au plat, accompagné de frites."),
            ("s3", "Chawarma Poulet (Grand)", "40.00", CHAWARMA_URL, "Grande portion de chawarma poulet."),
            ("s4", "Chawarma Spécial", "60.00", CHAWARMA_URL, "Chawarma XXL : poulet, viande hachée et garnitures."),
            ("s5", "Brochette Poulet Sandwich", "25.00", img(KEBABS[1]), ""),
            ("s6", "Brochette Viande Hachée Sandwich", "25.00", img(KEBABS[2]), ""),
            ("s7", "Brochette Viande Sandwich", "30.00", img(KEBABS[0]), ""),
            ("s8", "Panini Thon", "22.00", img(SANDWICH), ""),
            ("s9", "Panini Viande Hachée", "25.00", img(SANDWICH), ""),
            ("s10", "Panini Poulet", "25.00", img(SANDWICH), ""),
            ("s11", "Panini à la Dinde", "25.00", img(SANDWICH), ""),
            ("s12", "Panini Crevettes", "30.00", img(SANDWICH), ""),
            ("s13", "Panini Mixte", "30.00", img(SANDWICH), ""),
            ("s14", "Hamburger Simple + Frites", "20.00", img(BURGERS[0]), ""),
            ("s15", "Eggburger + Frites", "25.00", img(BURGERS[1]), ""),
            ("s16", "Cheeseburger + Frites", "25.00", img(BURGERS[2]), ""),
            ("s17", "Quality Burger (Œuf + Fromage)", "30.00", img(BURGERS[3]), ""),
        ],
    ),
    (
        "🍟 LES ENTRÉES CHAUDES",
        [
            ("c1", "Portion de Frites", "8.00", img(BURGERS[3]), ""),
            ("c2", "Soupe aux Poissons", "25.00", img(SOUP), ""),
            ("c3", "Omelette (au choix)", "30.00", img(OMELETTE), ""),
            ("c4", "Crevette Pil Pil", "50.00", img(SHRIMP), ""),
        ],
    ),
    (
        "🍝 LES PÂTES",
        [
            ("p1", "Spaghetti Bolognaise", "35.00", img(PASTA), ""),
            ("p2", "Spaghetti Fruits de Mer", "40.00", img(SEAFOOD_PASTA), ""),
            ("p3", "Lasagne Bolognaise", "35.00", img(PASTA), ""),
            ("p4", "Lasagne Fruits de Mer", "40.00", img(SEAFOOD_PASTA), ""),
        ],
    ),
    (
        "🥩 GRILLADES",
        [
            ("g1", "Brochette Poulet au Plat", "40.00", img(KEBABS[1]), ""),
            ("g2", "Brochette Viande au Plat", "45.00", img(KEBABS[0]), ""),
            ("g3", "Brochette Viande Hachée au Plat", "45.00", img(KEBABS[2]), ""),
            ("g4", "Escalope de Poulet Grillée au Plat", "40.00", img(KEBABS[0]), ""),
            ("g5", "Escalope de Viande Grillée au Plat", "45.00", img(KEBABS[2]), ""),
            ("g6", "Filet à la Crème et aux Champignons", "55.00", img(KEBABS[1]), ""),
        ],
    ),
    (
        "🥤 LES BOISSONS",
        [
            ("b1", "English Tea", "10.00", img(TEA), ""),
            ("b2", "Thé Vert", "10.00", img(TEA), ""),
            ("b3", "Canette", "10.00", img(CAN), ""),
            ("b4", "Limonade Maxi", "8.00", img(JUICE), ""),
            ("b5", "Red Bull", "20.00", img(ENERGY), ""),
            ("b6", "Sidi Ali 1,5 L", "20.00", img(WATER), ""),
            ("b7", "Sidi Ali 50 cl", "6.00", img(WATER), ""),
            ("b8", "Oulmès", "10.00", img(WATER), ""),
            ("b9", "Jus de Citron", "8.00", img(JUICE), ""),
            ("b10", "Jus d'Orange", "12.00", img(ORANGE_JUICE), ""),
            ("b11", "Banane", "15.00", img(JUICE), ""),
            ("b12", "Panaché", "18.00", img(MIXED_DRINK), ""),
        ],
    ),
    (
        "🍰 DESSERTS",
        [
            ("d1", "Crème Caramel", "15.00", img(CRÈME), ""),
            ("d2", "Tarte au Citron", "15.00", img(DONUTS), ""),
            ("d3", "Salade de Fruits", "20.00", img(FRUIT_SALAD), ""),
        ],
    ),
    (
        "🍕 PIZZAS",
        [
            ("z1", "Pizza Margarita", "30.00", img(PIZZAS[0]), "Tomate, mozzarella et basilic."),
            ("z2", "Pizza Gambita", "35.00", img(PIZZAS[4]), ""),
            ("z3", "Pizza Milano", "35.00", img(PIZZAS[2]), ""),
            ("z4", "Pizza Poulet", "35.00", img(PIZZAS[3]), "Poulet, mozzarella et sauce tomate."),
            ("z5", "Pizza Coupole", "35.00", img(PIZZAS[1]), ""),
            ("z6", "Pizza Napolitaine", "35.00", img(PIZZAS[0]), ""),
            ("z7", "Pizza Les Amis", "55.00", img(PIZZAS[4]), "La pizza signature de la maison, garnie généreusement."),
            ("z8", "Pizza Bolognaise", "35.00", img(PIZZAS[2]), "Sauce bolognaise, mozzarella."),
            ("z9", "Pizza Moitié Moitié", "40.00", img(PIZZAS[3]), "Deux garnitures au choix sur une même pizza."),
            ("z10", "Pizza Végétarienne", "35.00", img(PIZZAS[1]), "Légumes frais et mozzarella."),
            ("z11", "Pizza Quatre Saison", "40.00", img(PIZZAS[0]), ""),
            ("z12", "Pizza Fruits de Mer", "40.00", img(PIZZAS[4]), ""),
            ("z13", "Pizza Royale", "50.00", img(PIZZAS[2]), ""),
        ],
    ),
]


def seed(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")
    MenuCategory = apps.get_model("restaurants", "MenuCategory")
    MenuItem = apps.get_model("restaurants", "MenuItem")

    restaurant, _ = Restaurant.objects.update_or_create(
        slug=SLUG,
        defaults={
            "name": "Pizzeria Les Amis",
            "cuisine": "pizza",
            "tags": ["Pizza", "Snack", "Sandwichs"],
            "distance_label": "",
            "delivery_time": "30-45 min",
            "promo_label": "",
            "fee_label": "20 DH",
            "cover_url": COVER_URL,
            "logo_url": COVER_URL,
            "description": "Pizzeria Les Amis — pizzas au feu de bois, chawarma, sandwichs, grillades et pâtes, préparés avec des produits frais. Livraison rapide sur toute la ville.",
            "rating": "4.8",
            "is_active": True,
        },
    )

    for cat_order, (cat_name, items) in enumerate(MENU):
        cat, _ = MenuCategory.objects.get_or_create(
            restaurant=restaurant,
            name=cat_name,
            defaults={"sort_order": cat_order},
        )
        for sort_i, (eid, name, price, image, desc) in enumerate(items):
            MenuItem.objects.update_or_create(
                restaurant=restaurant,
                external_id=eid,
                defaults={
                    "category": cat,
                    "name": name,
                    "description": desc,
                    "price_mad": Decimal(price),
                    "image_url": image,
                    "sort_order": sort_i,
                    "is_available": True,
                },
            )


def unseed(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")
    Restaurant.objects.filter(slug=SLUG).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0010_restaurant_delivery_time_restaurant_rating"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
