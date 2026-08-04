from django.db import migrations


def forwards(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")
    Restaurant.objects.filter(slug="tchoco-charly").update(
        cuisine="drinks",
        tags=["Chocolat", "Restaurant", "Goûter"],
    )


def backwards(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")
    Restaurant.objects.filter(slug="tchoco-charly").update(
        cuisine="dessert",
        tags=["Chocolat", "Desserts"],
    )


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0020_chhiwat_opening_hours"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
