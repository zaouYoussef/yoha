from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0016_restaurantoffer_category_ids"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurantoffer",
            name="item_ids",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="IDs de MenuItem concernés. Vide = pas de filtre plat.",
            ),
        ),
        migrations.AlterField(
            model_name="restaurantoffer",
            name="category_ids",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="IDs de MenuCategory concernées. Vide = pas de filtre catégorie.",
            ),
        ),
    ]
