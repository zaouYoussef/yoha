from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0003_restaurant_phone"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="restaurant",
            name="rating",
        ),
        migrations.RemoveField(
            model_name="restaurant",
            name="review_count",
        ),
    ]
