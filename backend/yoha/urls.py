from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import IsAdminUser

from apps.core.views import RootView

urlpatterns = [
    path("", RootView.as_view(), name="root"),
    path("zaoujal/", admin.site.urls),
    path("api/v1/", include("apps.core.urls")),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/restaurants/", include("apps.restaurants.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/marketing/", include("apps.marketing.urls")),
    path("api/schema/", SpectacularAPIView.as_view(permission_classes=[IsAdminUser]), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema", permission_classes=[IsAdminUser]),
        name="swagger-ui",
    ),
]

handler400 = "apps.core.views.bad_request_handler"
handler403 = "apps.core.views.permission_denied_handler"
handler404 = "apps.core.views.not_found_handler"
handler500 = "apps.core.views.server_error_handler"

if settings.DEBUG:
    from django.conf.urls.static import static

    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)