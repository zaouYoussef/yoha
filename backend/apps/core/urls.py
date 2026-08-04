from django.urls import path

from apps.restaurants.cdn_views import CdnImageProxyView

from .views import HealthView, ReadyView, TrackEventView, AnalyticsDashboardView, ClientsAnalyticsView, ClientDetailAnalyticsView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("ready/", ReadyView.as_view(), name="ready"),
    path("media/i/<str:token>/", CdnImageProxyView.as_view(), name="cdn-image-proxy"),
    path("analytics/track/", TrackEventView.as_view(), name="track-event"),
    path("analytics/dashboard/", AnalyticsDashboardView.as_view(), name="analytics-dashboard"),
    path("analytics/clients/", ClientsAnalyticsView.as_view(), name="analytics-clients"),
    path("analytics/client/<path:pk>/", ClientDetailAnalyticsView.as_view(), name="analytics-client-detail"),
]
