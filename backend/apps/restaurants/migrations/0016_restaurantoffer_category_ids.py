from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0015_menuitem_modifiers_manual"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurantoffer",
            name="category_ids",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="IDs de MenuCategory concernées. Vide = toutes les catégories.",
            ),
        ),
    ]
