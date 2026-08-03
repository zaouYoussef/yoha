"""`python manage.py glovo_to_seed <slug>` — génère une migration de seed Glovo.

Récupère le menu d'un store depuis l'API Glovo et écrit une migration
RunPython prête à l'emploi (comme `0012_seed_mr_tacos`) :

    python manage.py glovo_to_seed mr-tacos-tanger --out 0014_seed_kamora.py
"""
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.restaurants.glovo import GlovoError
from apps.restaurants.glovo_sync import _fetch_menu, build_sync_targets

MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "migrations"


class Command(BaseCommand):
    help = "Génère une migration de seed à partir du menu Glovo d'un store."

    def add_arguments(self, parser):
        parser.add_argument("slug", help="Slug du store (ex: mr-tacos-tanger)")
        parser.add_argument("--out", default=None, help="Fichier de sortie (défaut: migrations/00NN_seed_<slug>.py)")

    def handle(self, *args, **options):
        targets = [t for t in build_sync_targets() if t.slug == options["slug"]]
        if not targets:
            raise CommandError(f"Aucun store Glovo « {options['slug']} » configuré.")
        store = targets[0]

        try:
            sections = _fetch_menu(store)
        except GlovoError as exc:
            raise CommandError(f"Récupération du menu : {exc}")

        out = Path(options["out"]) if options["out"] else self._default_path(store.slug)
        out.write_text(self._render(store, sections), encoding="utf-8")
        self.stdout.write(self.style.SUCCESS(f"Seed généré → {out}"))

    def _default_path(self, slug: str) -> Path:
        existing = sorted(MIGRATIONS_DIR.glob("[0-9]*_*.py"))
        last = existing[-1].name.split("_", 1)[0] if existing else "0000"
        num = str(int(last) + 1).zfill(4)
        return MIGRATIONS_DIR / f"{num}_seed_{slug.replace('-', '_')}.py"

    def _render(self, store, sections) -> str:
        lines = [
            f'"""Seed du restaurant « {store.name or store.slug} » (menu complet, photos Glovo)."""',
            "from decimal import Decimal",
            "",
            "from django.db import migrations",
            "",
            f'SLUG = "{store.slug}"',
            f'COVER_URL = "{store.cover_url}"',
            f'LOGO_URL = "{store.logo_url}"',
            "",
            "MENU = [",
        ]

        used: set[str] = set()
        for section in sections:
            lines.append(f"    ({section.title!r}, [")
            for product in section.products:
                eid = self._unique_eid(product.external_id, used)
                price = f"{product.price_mad:.2f}"
                lines.append(
                    f"        ({eid!r}, {product.name!r}, {price!r}, "
                    f"{product.image_url!r}, {product.description!r}),"
                )
            lines.append("    ]),")
        lines += [
            "]",
            "",
            "",
            "def seed(apps, schema_editor):",
            '    Restaurant = apps.get_model("restaurants", "Restaurant")',
            '    MenuCategory = apps.get_model("restaurants", "MenuCategory")',
            '    MenuItem = apps.get_model("restaurants", "MenuItem")',
            "",
            "    restaurant, _ = Restaurant.objects.update_or_create(",
            "        slug=SLUG,",
            "        defaults={",
            f'            "name": {store.name or store.slug.title()!r},',
            f'            "cuisine": {store.cuisine!r},',
            f'            "tags": {store.tags!r},',
            '            "delivery_time": ' + repr(store.delivery_time or "25-40 min") + ",",
            '            "fee_label": "Livraison offerte",',
            '            "cover_url": COVER_URL,',
            '            "logo_url": LOGO_URL,',
            '            "glovo_store_id": ' + str(store.store_id) + ",",
            '            "glovo_address_id": ' + str(store.address_id) + ",",
            f'            "glovo_slug": {store.glovo_slug!r},',
            '            "glovo_enabled": True,',
            '            "is_active": True,',
            "        },",
            "    )",
            "",
            "    for cat_order, (cat_name, items) in enumerate(MENU):",
            "        cat, _ = MenuCategory.objects.get_or_create(",
            "            restaurant=restaurant,",
            "            name=cat_name,",
            '            defaults={"sort_order": cat_order},',
            "        )",
            "        for sort_i, (eid, name, price, image, desc) in enumerate(items):",
            "            MenuItem.objects.update_or_create(",
            "                restaurant=restaurant,",
            "                external_id=eid,",
            "                defaults={",
            '                    "category": cat,',
            '                    "name": name,',
            '                    "description": desc[:300],',
            '                    "ingredients": desc,',
            '                    "price_mad": Decimal(price),',
            '                    "image_url": image,',
            '                    "sort_order": sort_i,',
            '                    "is_available": True,',
            "                },",
            "            )",
            "",
            "",
            "def unseed(apps, schema_editor):",
            '    Restaurant = apps.get_model("restaurants", "Restaurant")',
            "    Restaurant.objects.filter(slug=SLUG).delete()",
            "",
            "",
            "class Migration(migrations.Migration):",
            "",
            "    dependencies = [",
            f'        ("restaurants", "{self._latest_migration()}"),',
            "    ]",
            "",
            "    operations = [",
            "        migrations.RunPython(seed, unseed),",
            "    ]",
            "",
        ]
        return "\n".join(lines)

    def _latest_migration(self) -> str:
        existing = sorted(MIGRATIONS_DIR.glob("[0-9]*_*.py"))
        return existing[-1].name.replace(".py", "") if existing else "0001_initial"

    @staticmethod
    def _unique_eid(external_id: str, used: set[str]) -> str:
        base = external_id[:40]
        eid = base
        n = 1
        while eid in used:
            n += 1
            eid = f"{base[:36]}-{n}"
        used.add(eid)
        return eid
