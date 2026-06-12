from django.db import migrations, models

import apps.restaurants.opening_hours


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0006_menuitem_ingredients"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="opening_hours",
            field=models.JSONField(
                blank=True,
                default=apps.restaurants.opening_hours.default_opening_hours,
                help_text="Horaires par jour (clés monday…sunday).",
            ),
        ),
    ]
