from django.urls import path

from .views import AdminPromoDetailView, AdminPromoListView, UnsubscribeView, ValidatePromoView

urlpatterns = [
    path("unsubscribe/", UnsubscribeView.as_view(), name="marketing-unsubscribe"),
    path("promos/validate/", ValidatePromoView.as_view(), name="marketing-promo-validate"),
    path("promos/", AdminPromoListView.as_view(), name="marketing-promos"),
    path("promos/<int:pk>/", AdminPromoDetailView.as_view(), name="marketing-promo-detail"),
]
