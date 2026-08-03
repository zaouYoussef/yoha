# Generated manually for OrderLine.options

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0008_order_ordonnance_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="orderline",
            name="options",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name="orderline",
            name="item_name",
            field=models.CharField(max_length=400),
        ),
    ]
