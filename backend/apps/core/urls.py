from django.urls import path

from .views import HealthView, ReadyView, TrackEventView, AnalyticsDashboardView, ClientsAnalyticsView, ClientDetailAnalyticsView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("ready/", ReadyView.as_view(), name="ready"),
    path("analytics/track/", TrackEventView.as_view(), name="track-event"),
    path("analytics/dashboard/", AnalyticsDashboardView.as_view(), name="analytics-dashboard"),
    path("analytics/clients/", ClientsAnalyticsView.as_view(), name="analytics-clients"),
    path("analytics/client/<uuid:pk>/", ClientDetailAnalyticsView.as_view(), name="analytics-client-detail"),
]
