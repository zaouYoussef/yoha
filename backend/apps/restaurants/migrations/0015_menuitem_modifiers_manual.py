from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0014_menuitemmodifiergroup_menuitemmodifieroption"),
    ]

    operations = [
        migrations.AddField(
            model_name="menuitem",
            name="modifiers_manual",
            field=models.BooleanField(
                default=False,
                help_text="Si True, la sync Glovo n'écrase pas les sauces/suppléments édités depuis le panel.",
            ),
        ),
    ]
