from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0002_image_storage_keys"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="phone",
            field=models.CharField(
                blank=True,
                default="",
                help_text="WhatsApp / téléphone du restaurant (ex. +212539123456)",
                max_length=30,
            ),
        ),
    ]
