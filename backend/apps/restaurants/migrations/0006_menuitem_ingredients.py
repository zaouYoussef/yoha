from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0005_remove_restaurant_eta_label"),
    ]

    operations = [
        migrations.AddField(
            model_name="menuitem",
            name="ingredients",
            field=models.TextField(blank=True, help_text="Ingrédients et description détaillée du plat"),
        ),
    ]
