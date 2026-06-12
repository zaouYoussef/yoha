from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_customer_email"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="cancelled_phase",
            field=models.CharField(
                blank=True,
                choices=[
                    ("before_pickup", "Avant récupération"),
                    ("after_pickup", "Après récupération"),
                ],
                default="",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="cancellation_reason",
            field=models.TextField(blank=True, default=""),
        ),
    ]
