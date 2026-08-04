"""Purge les mentions « Glovo » des libellés menu visibles côté client."""
import re

from django.db import migrations

_GLOVO_RE = re.compile(r"(?i)glovo")


def scrub(text: str, fallback: str = "") -> str:
    if not text:
        return fallback
    cleaned = _GLOVO_RE.sub("", text)
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip(" \t-–—·|/\\_")
    if not cleaned:
        return fallback
    if cleaned.lower() in {"promo", "promos"}:
        return "Promos"
    return cleaned


def fix_forward(apps, schema_editor):
    MenuCategory = apps.get_model("restaurants", "MenuCategory")
    MenuItem = apps.get_model("restaurants", "MenuItem")
    MenuItemModifierGroup = apps.get_model("restaurants", "MenuItemModifierGroup")
    MenuItemModifierOption = apps.get_model("restaurants", "MenuItemModifierOption")

    for cat in MenuCategory.objects.all().iterator():
        new_name = scrub(cat.name, fallback="Promos")[:120]
        if new_name == cat.name:
            continue
        clash = (
            MenuCategory.objects.filter(restaurant_id=cat.restaurant_id, name=new_name)
            .exclude(pk=cat.pk)
            .first()
        )
        if clash:
            MenuItem.objects.filter(category_id=cat.pk).update(category_id=clash.pk)
            cat.delete()
        else:
            cat.name = new_name
            cat.save(update_fields=["name"])

    for item in MenuItem.objects.all().iterator():
        updates = {}
        new_name = scrub(item.name, fallback=item.name)[:200]
        if new_name != item.name:
            updates["name"] = new_name
        new_desc = scrub(item.description or "", fallback="")[:300]
        if new_desc != (item.description or ""):
            updates["description"] = new_desc
        ingredients = getattr(item, "ingredients", None)
        if ingredients is not None:
            new_ing = scrub(ingredients or "", fallback="")
            if new_ing != (ingredients or ""):
                updates["ingredients"] = new_ing
        if updates:
            for k, v in updates.items():
                setattr(item, k, v)
            item.save(update_fields=list(updates.keys()))

    for grp in MenuItemModifierGroup.objects.all().iterator():
        new_name = scrub(grp.name, fallback=grp.name)[:120]
        if new_name == grp.name:
            continue
        clash = (
            MenuItemModifierGroup.objects.filter(menu_item_id=grp.menu_item_id, name=new_name)
            .exclude(pk=grp.pk)
            .first()
        )
        if clash:
            MenuItemModifierOption.objects.filter(group_id=grp.pk).update(group_id=clash.pk)
            grp.delete()
        else:
            grp.name = new_name
            grp.save(update_fields=["name"])

    for opt in MenuItemModifierOption.objects.all().iterator():
        new_name = scrub(opt.name, fallback=opt.name)[:120]
        if new_name == opt.name:
            continue
        clash = (
            MenuItemModifierOption.objects.filter(group_id=opt.group_id, name=new_name)
            .exclude(pk=opt.pk)
            .first()
        )
        if clash:
            opt.delete()
        else:
            opt.name = new_name
            opt.save(update_fields=["name"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0018_seed_chhiwat_sans_gluten"),
    ]

    operations = [
        migrations.RunPython(fix_forward, noop),
    ]
