from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0003_order_cancellation"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrderPushSubscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.CharField(db_index=True, max_length=40)),
                ("expo_push_token", models.CharField(db_index=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "abonnement push commande",
                "verbose_name_plural": "abonnements push commande",
            },
        ),
        migrations.AddConstraint(
            model_name="orderpushsubscription",
            constraint=models.UniqueConstraint(
                fields=("public_id", "expo_push_token"),
                name="orders_push_sub_public_token_uniq",
            ),
        ),
    ]
