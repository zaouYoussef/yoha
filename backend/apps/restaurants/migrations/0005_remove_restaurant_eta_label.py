from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0004_remove_restaurant_rating"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="restaurant",
            name="eta_label",
        ),
    ]
