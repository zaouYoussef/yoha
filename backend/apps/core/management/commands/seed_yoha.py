"""
Peuple la base avec restaurants, comptes démo et livreurs.
Usage: python manage.py seed_yoha
"""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.orders.models import CourierProfile
from apps.restaurants.models import MenuCategory, MenuItem, Restaurant

User = get_user_model()

_U = "https://images.unsplash.com/photo-{id}?w={w}&q=80&auto=format&fit=crop"


def img(photo_id: str, w: int = 400) -> str:
    return _U.format(id=photo_id, w=w)


RESTAURANT_MEDIA = {
    "pizza-detroit-tanger": {
        "cover_url": img("1565299624946-b28f40a0ae38", 1200),
        "logo_url": img("1513104890138-7c749659a591", 160),
        "items": {
            "m1": img("1574071318508-1cdbab80d002"),
            "m2": img("1628840042765-356cda07504e"),
            "m3": img("1593560708920-61dd98c46a4e"),
            "d1": img("1556679343-c7306c1976bc"),
            "d2": img("1510707577719-ae7c14805e3a"),
        },
    },
    "new-school-tacos-tanger": {
        "cover_url": img("1551504734-5ee1c4a1479b", 1200),
        "logo_url": img("1565299585323-38d6b0865b47", 160),
        "items": {
            "m1": img("1551504734-5ee1c4a1479b"),
            "m2": img("1565299585323-38d6b0865b47"),
            "m3": img("1599970654581-026be7cefb40"),
            "d1": img("1556679343-c7306c1976bc"),
            "d2": img("1546173150-3151a39048a5"),
        },
    },
    "bomos-kebab": {
        "cover_url": img("1603360946369-dc9bb6258143", 1200),
        "logo_url": img("1555939594-58d7cb561ad1", 160),
        "items": {
            "m1": img("1603360946369-dc9bb6258143"),
            "m2": img("1544025162-d76694265947"),
            "m3": img("1555939594-58d7cb561ad1"),
            "d1": img("1556679343-c7306c1976bc"),
            "d2": img("1510707577719-ae7c14805e3a"),
        },
    },
    "soju-sushi-tanger": {
        "cover_url": img("1579871494447-9811cf80d66c", 1200),
        "logo_url": img("1611143669185-af224c5e3252", 160),
        "items": {
            "m1": img("1579871494447-9811cf80d66c"),
            "m2": img("1583623025817-d180a2221d0a"),
            "m3": img("1617196034796-73dfa7b1fd56"),
            "d1": img("1564834744159-ff0ea41ba4b9"),
            "d2": img("1607330289024-1535c6b4e1c1"),
        },
    },
    "the-burger-boutique": {
        "cover_url": img("1568901346375-23c9450c58cd", 1200),
        "logo_url": img("1606131731446-5568d87113aa", 160),
        "items": {
            "m1": img("1571091655789-405eb7a3a3a8"),
            "m2": img("1551782450-a2132b4ba21d"),
            "m3": img("1565299507177-b0ac66763828"),
            "d1": img("1573080496219-bb080dd4f877"),
            "d2": img("1572490122747-3968b75cc699"),
        },
    },
    "medeat": {
        "cover_url": img("1547573854-74d2a71d0826", 1200),
        "logo_url": img("1559847844-5315695dadae", 160),
        "items": {
            "m1": img("1547573854-74d2a71d0826"),
            "m2": img("1467003909585-2f8a72700288"),
            "m3": img("1490645935967-10de6ba17061"),
            "d1": img("1561882468-9110e03e0f78"),
            "d2": img("1488477181946-6428a0291777"),
        },
    },
    "healthy-bowl": {
        "cover_url": img("1546069901-ba9599a7e63c", 1200),
        "logo_url": img("1490645935967-10de6ba17061", 160),
        "items": {
            "m1": img("1512621776951-a57141f2eefd"),
            "m2": img("1546069901-d5bfd2cbfb1f"),
            "m3": img("1529059997568-3d847b1154f0"),
            "d1": img("1610970881699-44a5587cabec"),
            "d2": img("1623065422902-30a2d299bbe4"),
        },
    },
}

DEFAULT_ITEM_IMAGES = {
    "m1": img("1546069901-ba9599a7e63c"),
    "m2": img("1565299624946-b28f40a0ae38"),
    "m3": img("1574071318508-1cdbab80d002"),
    "d1": img("1556679343-c7306c1976bc"),
    "d2": img("1510707577719-ae7c14805e3a"),
}

RESTAURANTS = [
    ("pizza-detroit-tanger", "Pizza Detroit Tanger", "pizza", "6,2 km", "Top ventes", "+212539100001"),
    ("new-school-tacos-tanger", "New School Tacos Tanger", "tacos", "9,1 km", "Menu étudiant", "+212539100002"),
    ("bomos-kebab", "Bomo's Kebab", "kebab", "7,5 km", "Saveurs Berlin style", "+212539100003"),
    ("soju-sushi-tanger", "Soju Sushi Tanger", "sushi", "2,4 km", "Menu deluxe", "+212539100004"),
    ("the-burger-boutique", "The Burger Boutique", "burger", "7,9 km", "Menu complet", "+212539100005"),
    ("medeat", "MedEat", "medical", "4,2 km", "Partenaire hôpital", "+212539100006"),
    ("healthy-bowl", "Healthy Bowl", "healthy", "4,4 km", "Exclu campus", "+212539100007"),
]

DEMO_USERS = [
    ("admin@yoha.ma", "Admin démo", "admin", "DemoAdmin2025!"),
    ("livreur@yoha.ma", "Livreur démo", "courier", "DemoCourier2025!"),
    ("resto@yoha.ma", "Restaurant démo", "restaurant", "DemoResto2025!"),
    ("client@yoha.ma", "Client démo", "client", "DemoClient2025!"),
]

COURIERS = [
    ("Yacine A.", "+212611223344", "Scooter", 4.9),
    ("Hamza R.", "+212622334455", "Vélo", 4.8),
    ("Soukaina B.", "+212633445566", "Scooter", 5.0),
    ("Mehdi T.", "+212644556677", "Vélo", 4.7),
]

MENU_TEMPLATE = [
    ("⭐ Les plus commandés", [
        ("m1", "Plat signature", "9.90", "Spécialité maison", "Pain, protéine au choix, fromage, crudités, sauce maison."),
        ("m2", "Menu duo", "14.50", "Pour deux", "Deux plats au choix, accompagnement et boisson 33 cl."),
        ("m3", "Formule étudiant", "7.90", "Prix campus", "Plat du jour, frites ou salade, boisson incluse."),
    ]),
    ("🥤 Pour accompagner", [
        ("d1", "Boisson 33 cl", "2.50", "Au choix", "Coca-Cola, Fanta, Sprite ou thé glacé."),
        ("d2", "Eau minérale", "1.50", "50 cl", "Eau minérale naturelle, bouteille 50 cl."),
    ]),
]


class Command(BaseCommand):
    help = "Initialise YouHa (restaurants, comptes démo)"

    @transaction.atomic
    def handle(self, *args, **options):
        first_resto = None
        for slug, name, cuisine, distance, promo, phone in RESTAURANTS:
            media = RESTAURANT_MEDIA.get(slug, {})
            r, _ = Restaurant.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "cuisine": cuisine,
                    "tags": [cuisine.capitalize()],
                    "distance_label": distance,
                    "promo_label": promo,
                    "phone": phone,
                    "description": f"{name} — livraison campus YouHa",
                    "cover_url": media.get("cover_url", img("1546069901-ba9599a7e63c", 1200)),
                    "logo_url": media.get("logo_url", img("1513104890138-7c749659a591", 160)),
                    "is_active": True,
                },
            )
            if first_resto is None:
                first_resto = r
            item_images = media.get("items", DEFAULT_ITEM_IMAGES)
            for cat_order, (cat_name, items) in enumerate(MENU_TEMPLATE):
                cat, _ = MenuCategory.objects.get_or_create(
                    restaurant=r,
                    name=cat_name,
                    defaults={"sort_order": cat_order},
                )
                for sort_i, row in enumerate(items):
                    eid, iname, price, desc = row[:4]
                    ingredients = row[4] if len(row) > 4 else ""
                    MenuItem.objects.update_or_create(
                        restaurant=r,
                        external_id=eid,
                        defaults={
                            "category": cat,
                            "name": iname,
                            "description": desc,
                            "ingredients": ingredients,
                            "price_mad": Decimal(price),
                            "image_url": item_images.get(eid, DEFAULT_ITEM_IMAGES.get(eid, img("1546069901-ba9599a7e63c"))),
                            "sort_order": sort_i,
                            "is_available": True,
                        },
                    )
        self.stdout.write(self.style.SUCCESS(f"{len(RESTAURANTS)} restaurants avec menus et photos."))

        for email, display, role, password in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"display_name": display, "role": role},
            )
            if created or not user.has_usable_password():
                user.set_password(password)
                user.save()
        self.stdout.write(self.style.SUCCESS("Comptes démo (mots de passe forts dans seed)."))

        resto_user = User.objects.get(email="resto@yoha.ma")
        if first_resto:
            first_resto.owner = resto_user
            first_resto.save(update_fields=["owner"])

        courier_user = User.objects.get(email="livreur@yoha.ma")
        for i, (name, phone, vehicle, rating) in enumerate(COURIERS):
            cp, _ = CourierProfile.objects.update_or_create(
                display_name=name,
                defaults={
                    "phone": phone,
                    "vehicle": vehicle,
                    "rating": Decimal(str(rating)),
                    "is_active": True,
                },
            )
            if i == 0:
                cp.user = courier_user
                cp.save(update_fields=["user"])

        self.stdout.write(self.style.SUCCESS("Livreurs et liaisons comptes pro OK."))
        self.stdout.write("Comptes: admin@yoha.ma, livreur@yoha.ma, resto@yoha.ma, client@yoha.ma")
        self.stdout.write("Mots de passe: Demo*2025! (voir seed_yoha.py)")
