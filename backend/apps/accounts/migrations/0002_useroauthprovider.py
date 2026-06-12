import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserOAuthProvider",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "provider",
                    models.CharField(
                        choices=[("google", "Google"), ("apple", "Apple")],
                        db_index=True,
                        max_length=20,
                    ),
                ),
                ("provider_uid", models.CharField(db_index=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="oauth_providers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "liaison OAuth",
                "verbose_name_plural": "liaisons OAuth",
            },
        ),
        migrations.AddConstraint(
            model_name="useroauthprovider",
            constraint=models.UniqueConstraint(
                fields=("provider", "provider_uid"),
                name="accounts_oauth_provider_uid_uniq",
            ),
        ),
    ]
