from django.urls import path

from .views import DutyPharmacyListView, PharmacyDetailView, PharmacySearchView

urlpatterns = [
    path("duty/", DutyPharmacyListView.as_view(), name="pharmacy-duty-list"),
    path("search/", PharmacySearchView.as_view(), name="pharmacy-search"),
    path("<slug:slug>/", PharmacyDetailView.as_view(), name="pharmacy-detail"),
]
