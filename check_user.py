import sys
sys.path.insert(0, "backend")
import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "yoha.settings.production")
os.environ["AXES_ENABLED"] = "False"
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.filter(email="zaoujal@zaoujal.ma").first()
print(f"exists={u is not None}, superuser={u.is_superuser if u else None}, role={getattr(u, 'role', None) if u else None}, active={u.is_active if u else None}")
