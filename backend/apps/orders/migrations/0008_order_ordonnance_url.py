from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0007_review"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="ordonnance_url",
            field=models.URLField(
                blank=True,
                default="",
                help_text="URL de l'image d'ordonnance (commandes pharmacie sur-mesure)",
                max_length=500,
            ),
        ),
    ]
