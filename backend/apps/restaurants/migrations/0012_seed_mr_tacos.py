"""Seed du restaurant « Mr.Tacos — Tanger » (menu complet, photos Glovo)."""
from decimal import Decimal

from django.db import migrations

SLUG = "mr-tacos-tanger"

_G = "https://glovo.dhmedia.io/image/menus-glovo/products/"
_GS = "https://glovo.dhmedia.io/image/global-menu-service/GV_MA/vendor/527734/product/"


def g(pid):
    return f"{_G}{pid}"


def gs(pid):
    return f"{_GS}{pid}"


# Cover/logo officiels du store Mr.Tacos (Glovo) — cover 4000×2288, logo 1000×1000.
COVER_URL = "https://glovo.dhmedia.io/image/stores-glovo/stores/ff0eaffbcf05631daf2356646d2d72232338f1b97cbe6a8dd5a5d019bbf73734"
LOGO_URL = "https://glovo.dhmedia.io/image/customer-assets-glovo/store_logos/d554a4453c44dfa15e126020b6acb9e8475e1627a8033e4baea358e4f72a6e41"

TACOS_DESC = "Servi avec frites zigzag ou potatoes selon stock disponible."

# Titres alignés sur les sections du menu Glovo (la synchro fusionne ensuite).
MENU = [
    (
        "Mr. Box",
        [
            ("b1", "Mr.Box Mixte", "168.00", g("430a5c7c3dae77a9257d2964685416ca480c74b051e71136f1851785f3cd4745"), "Mixte de mini tacos / wrap / sandwich, ration de pièces mixte, ration de frites, sauces variées."),
            ("b2", "Mr.Box Tacos", "164.80", g("2d123b5ad2dd7829448c252207cd03f52a6c5224ee0f989b0d4283d84744d480"), "4 Mini tacos, ration de pièces mixte, ration de frites, sauces variées."),
            ("b3", "Mr.Box Wrap", "160.00", g("754d7ef2625e736d8c004b986dc6c0f2ed3738d05714b3f8e4dcb95b41543a73"), "4 Mini wrap, ration de pièces mixte, ration de frites, sauces variées."),
            ("b4", "Mr.Box Sandwich", "153.60", g("d4f336888aeb1d44375b384be60a58ee1770d3e15b52c6cba4000b3ca7d6c4f2"), "4 Mini sandwich, ration de pièces mixte, ration de frites, sauces variées."),
            ("b5", "Mr.Box Burger", "148.00", g("1597fe87b8e9e44a8f7acbad9936bcc23bdcabae93657d22bbcf512fd258fc93"), "4 Mini burger, ration de pièces mixte, ration de frites, sauces variées."),
        ],
    ),
    (
        "Mini Box",
        [
            ("mb1", "Box Classic Oulmes", "130.40", g("51d8578f5685ebe5ad9abe070b46f2531a0965bc0fc56b3e6054f637ce447398"), "3 Tenders, 2 pilons de poulet, 2 ailes de poulet + ration cheesy fries + ration pieces + Oulmes"),
            ("mb2", "Mini box mixte", "124.00", gs("34acb6fc-f583-46ec-ba08-07cf2d8b4696.jpg"), "Mixte de mini tacos / sandwich, ration de pièces mixte, ration de frites, sauces variées."),
            ("mb3", "Dynamite spicy", "124.00", gs("bc2489f8-1fa8-4203-ba07-c268e608e0bb.jpg"), "3 Tenders, 2 pilons de poulet, 2 ailes de poulet + ration cheesy fries + ration pieces"),
            ("mb4", "Box Classic", "124.00", gs("4538797d-fbcc-457b-a3fe-7957624bddac.jpg"), "3 Tenders, 2 pilons de poulet, 2 ailes de poulet + ration cheesy fries + ration pieces"),
        ],
    ),
    (
        "Méga box",
        [
            ("mg1", "Méga box Mixte", "214.40", g("67183b059d50fb6d26a3983e8cb46728e74d41c2529b77e208d4539970f0b34d"), "Mixte de mini tacos / wrap / sandwich / burger, ration de pièces mixte, ration de frites, sauces variées."),
            ("mg2", "Méga Box tacos", "204.80", g("dd192f562e93fa4d3d2011a0a35c91dd9ae727ddb6fece9479d73c3f75318bc8"), "6 Mini tacos, ration de pièces mixte, ration de frites, sauces variées."),
            ("mg3", "Méga box burger", "194.40", g("3150ddcb08d895ef22701f52606aeaffba5608d540627d8bc9978a1fd75bbffb"), "6 Mini burger, ration de pièces mixte, ration de frites, sauces variées."),
            ("mg4", "Méga box sandwich", "189.60", g("56818139b695239ce12474fdaf2fac0f8ec6f4d4f1c4d2ceb93e93b9a652d9ba"), "6 mini sandwich, ration de pièces mixte, ration de frites, sauces variées."),
            ("mg5", "Méga box wrap", "189.60", g("aafcd2280236e57bd70d92806ca28270f7e312ecc917c2c89cf2743388458af8"), "6 Mini wrap, ration de pièces mixte, ration de frites, sauces variées."),
        ],
    ),
    (
        "Tacos",
        [
            ("t1", "Tacos XXL", "88.00", g("abc6ce55dd799d437efdd394d13d73ea28b53196b81b0eeb780f605be4d127ab"), TACOS_DESC),
            ("t2", "Tacos XL", "72.00", g("85d9dea71228593f26d2ffc8a2a4d9323934af0841f40dd5a0f99b4f56b1fad4"), TACOS_DESC),
            ("t3", "Tacos L", "62.00", g("bb28b49f23a3013e14264a2ec84317fb02b660ea8557fabae167cca56c63aac9"), TACOS_DESC),
        ],
    ),
    (
        "Tacos Fruits de Mer",
        [
            ("tf1", "Tacos XXL (fm)", "105.00", g("abc6ce55dd799d437efdd394d13d73ea28b53196b81b0eeb780f605be4d127ab"), TACOS_DESC),
            ("tf2", "Tacos XL (fm)", "95.00", g("85d9dea71228593f26d2ffc8a2a4d9323934af0841f40dd5a0f99b4f56b1fad4"), TACOS_DESC),
            ("tf3", "Tacos L (fm)", "75.00", g("bb28b49f23a3013e14264a2ec84317fb02b660ea8557fabae167cca56c63aac9"), TACOS_DESC),
        ],
    ),
    (
        "Sandwich Pain Pita",
        [
            ("s1", "Sandwich Bazuka", "71.00", g("cea9b61e2c4bfde547374c1e96936a3f036c8fbc6f339e46266be1614108a2ca"), "Cordon bleu, poulet, champignon, gruyère, salade, tomate, servi avec frites."),
            ("s2", "Sandwich Avalanche", "71.00", g("835f23a2a36beb57df8be44ffaa119ac6235d2aab5bc52ce8107dfd7507684ef"), "Viande hachée, poulet, champignon, gruyère, salade, tomate, servi avec frites."),
            ("s3", "Sandwich Hummer", "71.00", g("9dd34376b2bf03522a7281632ba0f1ef91aa2b90d782bb632a2181def61329af"), "Cordon bleu, viande hachée, crispy oignons, salade, tomate, servi avec frites."),
            ("s4", "Sandwich AMG", "71.00", g("e7f226c4237b25b42e0ad6f29099d96f908cea03d48db6271dd47d2e235ee9a8"), "Viande hachée, cheddar, œuf, dinde fumée, crispy oignons, salade, tomate, servi avec frites."),
            ("s5", "Sandwich Swiss", "62.00", g("38755e00c148d413b93bd46b627744ed876e7a586c1fde8c4688bf989e916576"), "Poulet, champignon, gruyère, salade, tomate, servi avec frites."),
            ("s6", "Sandwich Triple X", "62.00", g("e49a36e1905df790c67a9896bf6c4fb91dddfb661cb99e3155e9fcfabfb1f749"), "Viande hachée, cheddar, crispy onions, salade, tomate, servi avec frites."),
            ("s7", "Sandwich Jaune", "57.00", g("016a70d23e83ef36a9ce97de02088f0bd18e4e92f9661499c538d76a7ac2e5d5"), "Poulet curry, cheddar, salade, tomate, servi avec frites."),
            ("s8", "Sandwich Rouge", "57.00", g("51894737321945fb32a92566577281272f9aaf381c96a543d762bf20943766b7"), "Poulet tandoori, cheddar, salade, tomate, servi avec frites."),
        ],
    ),
    (
        "Burgers",
        [
            ("h1", "Brazilero Burger", "69.00", g("3761115087998aac2ba7bce8830e29b753c0d14705149c1f08dcf056b3049aea"), "Steak haché, rosti, poulet pané, crispy oignons, fromage, salade, tomate."),
            ("h2", "Italiano", "69.00", g("9105e2f9e36299daa3c731209a14910f171de31ce2c70045026843b3d91e9022"), "2 Steak haché, oignons rings, fromage, salade, tomate."),
            ("h3", "Mushroom burger", "69.00", g("83c020323988ebdc6b912c4b10fef8f3681cc3a3a2a739155517c4332ef93477"), "Steak haché, champignon, fromage, salade, tomate."),
            ("h4", "Americano Burger", "59.00", g("db88db26f19286dea1ca9519e720b9986e279b6037e0ec6f0ea72d3d01d94991"), "Poulet pané, rosti, fromage, salade, tomate."),
            ("h5", "Cordon Bleu Burger", "57.00", g("b6cea000355af2712ce407a52bf72288e5e56176a7b185aab193e9da1a8543e0"), "Cordon bleu, œuf, dinde fumée, crispy oignons, salade, tomate."),
            ("h6", "Mexicano Burger", "57.00", g("01425f0dadacaa2ea857fd3b1e890b89e66e3adae71153a62e9ff98e819fc146"), "Steak haché, œuf, dinde fumée, fromage, crispy oignons, salade, tomate."),
            ("h7", "Chicken Burger", "53.00", g("b290bc8dfb5407d342f35a10bf0baaaf188a9d4a4b7a75cb53fef9242e5da0c5"), "Poulet pané, fromages, salade, tomate."),
            ("h8", "Fish Burger", "47.00", g("4c8478b0f60308f9aa2514fb4d6da0a383f7983b21476af4777dcc3be516cc98"), "Poisson pané, fromage, salade, tomate."),
            ("h9", "Double Cheese Burger", "41.00", g("033ff1e74e09783f4741043d6f4f598c6db83e4a825ea354c435c36f1b907007"), "2 Steaks viande hachée, 2 fromages, salade, cornichon."),
            ("h10", "Cheeseburger", "33.00", g("52595a52641382789bf9feeaadaf48bf17d3f0e19cce928380d06901d6ff8e7d"), "Steak viande hachée, fromage, salade, cornichon."),
        ],
    ),
    (
        "Wraps / Rolls",
        [
            ("w1", "Roma", "68.00", g("5bfdd4682719a516004d6ba9ff3b9cb082191efedb25976f60735e5a5ecf6261"), "Poulet pané, rosti, cheddar, salade, tomate."),
            ("w2", "Antalia", "65.00", g("7beebf437fe3dd7af3bda712d2ed816a8cb6578e897fa64d924e588d6ebbb896"), "Poulet pané, steak haché, cheddar, salade, tomate."),
            ("w3", "Delhi", "58.00", g("0f6460464aa5930ded0bf86cec54e7ef03134f2d395c52988691dcba36f37188"), "Steak haché, cheddar, salade, tomate."),
            ("w4", "Catalonia", "58.00", g("7648245b8cb2fbff357b5132f4ec52991bb332bfbee10e66004ae4776039f903"), "Poulet pané, cheddar, salade, tomate."),
        ],
    ),
    (
        "Mr.poutine",
        [
            ("p1", "Poutine tenders", "59.00", g("1bcf2e219c83c9307533e6e7d95143a0b5e37e041829ad9e03df00b737859d88"), "Zigzag fries, potatoes, tenders, dinde fumée, champignons, sauce fromage, sauce cheddar, gruyère, onion crispy."),
            ("p2", "Poutine viande hachée", "59.00", g("4ff5bf3849c4a844bda586c4313bfe3c9195d318e7b33d55374431538980ac4f"), "Zigzag fries, potatoes, viande hachée, dinde fumée, champignons, sauces."),
            ("p3", "Poutine fromage", "49.00", g("00d877e0984e43129a225c430b97eac5c0fb8d7459d32ffee44e20d6e384a05f"), "Zigzag fries, potatos, sauce fromage, sauce cheddar, gruyère, onion crispy."),
        ],
    ),
    (
        "Crunchy Pieces",
        [
            ("c1", "Cheese Sticks - 4 Pièces", "35.00", g("7acaeefc0fb524ad2e7c41c3ae7c10545d379c85e753f285088cfff5bb71db41"), ""),
            ("c2", "Camemberts - 4 Pièces", "35.00", g("1fe7bcd86fc1d0dffa919faeb14729e3a4ed1c448f57d4e7270fd89a9c966951"), ""),
            ("c3", "Chessy fries", "32.00", g("212aa325296b115bdd23a0e4a9ae7e797403baf56ebc119d22cc6a7965758b72"), ""),
            ("c4", "Nuggets - 4 Pièces", "25.00", g("6df9778903cfc3571846ce302916666d2b23e05c45ee715fec20691d3ef000ca"), ""),
            ("c5", "Onion rings - 4 Pièces", "20.00", g("ce2e3fdf02661b84cab9a0437a7002a9aa8d81e397b2b19b6954cb92dc6a5de7"), ""),
            ("c6", "Potatoes", "19.00", g("887227b91f73ce884cd48a46429064c51527cae65412cf68c1efbeb066807b25"), ""),
            ("c7", "Zigzag Fries", "16.00", g("67f81c156ad7c299975a59dc6e515f3c39d428386432dcecb9ecafde43a9f9ab"), ""),
        ],
    ),
    (
        "Menu Kids",
        [
            ("k1", "Menu Kids Tacos", "50.00", g("5056badbe5f419ffb09149ca963b6e9173a1dbd8efa96f36097ea771029f213c"), "Tacos viande hachée ou poulet classique, mini jus, yaourt, œuf surprise, frites."),
            ("k2", "Menu Kids Nuggets", "50.00", g("dbfcd4baf03e2a72446d89ebfdcb1937acc19f50a3d3dbd230c676c18aa9ca80"), "4 nuggets, mini jus, yaourt, œuf surprise, frites."),
            ("k3", "Menu Kids Burger", "50.00", g("1f1f890c32595f543a94d86bb57f61b9f6d5a6c1fc70950cc9f7570d5cd57467"), "Burger viande hachée, mini jus, yaourt, œuf surprise, frites."),
        ],
    ),
    (
        "Boissons",
        [
            ("d1", "Star-soda cola", "10.00", g("0d93b4d155683908c75ca53df6dc61fad1b1dc4e327f55213ffea80d01a948c5"), ""),
            ("d2", "Star-soda pomme", "10.00", g("527493a8bfd70dac63cde971e922fbe76cd182c65704e97fdf43ad0d316d0135"), ""),
            ("d3", "Star-soda citron", "10.00", g("6e90599a3b1e2fbf6482936d9de1b6c54c9a6f6359be8e7a8fc57b3c6311bacf"), ""),
            ("d4", "Star-soda ananas", "10.00", g("cbe3f46a14809d6b82ff87dc47c0124d1a70faddd03fae60424d1b3d10221ea7"), ""),
            ("d5", "Eau", "8.00", g("06937100b8db5fb4e5e49fbee168702fadad0ce643cb9bfb64d2e4adfe2bae81"), ""),
            ("d6", "Oulmès", "8.00", g("ea8d8c3d1fb8f4985af3d714324c7e014fb94f5c4c0f4e57f8073cbb3aa44eb1"), ""),
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
            "name": "Mr.Tacos — Tanger",
            "cuisine": "tacos",
            "tags": ["Tacos", "Burger", "Box", "Poutine"],
            "distance_label": "",
            "delivery_time": "25-40 min",
            "promo_label": "",
            "fee_label": "Livraison offerte",
            "cover_url": COVER_URL,
            "logo_url": LOGO_URL,
            "description": "Mr.Tacos — la référence des tacos XXL à Tanger : box généreuses, burgers, sandwichs pain pita, wraps et poutines. 97% de recommandation.",
            "rating": "4.9",
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
        ("restaurants", "0011_seed_pizzeria_les_amis"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
