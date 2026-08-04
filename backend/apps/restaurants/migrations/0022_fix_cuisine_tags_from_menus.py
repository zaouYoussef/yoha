from django.db import migrations

# Corrige cuisine + tags selon les menus réels (browse rails).
UPDATES = {
    "kamora": {"cuisine": "sushi", "tags": ["Sushi", "Japonais", "Asian"]},
    "melt-99": {"cuisine": "dessert", "tags": ["Crêpes", "Pancakes", "Desserts"]},
    "big-bunn": {"cuisine": "burger", "tags": ["Burger", "Sandwich"]},
    "al-mahroussa": {
        "cuisine": "kebab",
        "tags": ["Shawarma", "Sandwich", "Burger", "Pizza", "Tacos", "Marocain"],
    },
    "pizzeria-les-amis": {
        "tags": ["Pizza", "Shawarma", "Sandwich", "Burger", "Snack"],
    },
    "snack-roma": {
        "tags": ["Shawarma", "Sandwich", "Snack", "Pizza", "Tacos", "Burger"],
    },
    "beug-s-restaurant": {"tags": ["Burger", "Tacos", "Sandwich"]},
    "burns": {"tags": ["Burger", "Bowls"]},
    "crumby": {"tags": ["Brunch", "Café", "Desserts"]},
    "tchoco-charly": {"tags": ["Pizza", "Tacos", "Burger", "Shawarma"]},
    "oppa-chicken": {"tags": ["Poulet", "Coréen", "Burger"]},
    "crousty-house": {"tags": ["Poulet", "Asiatique", "Nouilles"]},
    "crousty-signature": {"tags": ["Burger", "Tenders", "Poulet"]},
    "matsco-food": {"tags": ["Tacos", "Pizza", "Burger", "Sandwich", "Shawarma"]},
    "matsco-sandwich": {"tags": ["Sandwich", "Shawarma", "Tacos", "Snack"]},
    "vicio": {"tags": ["Burger", "Poulet", "Tacos"]},
    "pam-pam": {"tags": ["Burger", "Tacos", "Snack", "Poutine"]},
    "little-mamma": {"tags": ["Pizza", "Italien"]},
    "maro-sushi": {"tags": ["Sushi", "Japonais", "Pizza"]},
    "indian-spice-tanger": {"tags": ["Indien", "Curry"]},
    "maison-glaces": {"tags": ["Crêpes", "Waffles", "Milkshake"]},
}


def forwards(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")
    for slug, payload in UPDATES.items():
        r = Restaurant.objects.filter(slug=slug).first()
        if not r:
            continue
        if "cuisine" in payload:
            r.cuisine = payload["cuisine"]
        if "tags" in payload:
            r.tags = payload["tags"]
        r.save(update_fields=[k for k in ("cuisine", "tags") if k in payload])


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0021_tchoco_charly_not_dessert"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
