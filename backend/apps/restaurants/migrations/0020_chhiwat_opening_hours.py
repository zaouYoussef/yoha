"""Horaires Ch'hiwat Sans Gluten (Google Maps)."""

from django.db import migrations

SLUG = "ch-hiwat-sans-gluten"

DAY = {"is_closed": False, "is_24h": False, "open": "09:30", "close": "19:00", "slots": []}
SAT = {"is_closed": False, "is_24h": False, "open": "09:30", "close": "16:00", "slots": []}
CLOSED = {"is_closed": True, "is_24h": False, "open": "09:30", "close": "19:00", "slots": []}

OPENING_HOURS = {
    "monday": dict(DAY),
    "tuesday": dict(DAY),
    "wednesday": dict(DAY),
    "thursday": dict(DAY),
    "friday": dict(DAY),
    "saturday": dict(SAT),
    "sunday": dict(CLOSED),
}


def apply_hours(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")
    Restaurant.objects.filter(slug=SLUG).update(opening_hours=OPENING_HOURS)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0019_scrub_glovo_branding"),
    ]

    operations = [
        migrations.RunPython(apply_hours, noop),
    ]
