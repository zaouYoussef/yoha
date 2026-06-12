from django.urls import path

from .views import CapturePaymentView, OrderLedgerView, OrderPaymentView

urlpatterns = [
    path("orders/<str:public_id>/", OrderPaymentView.as_view(), name="order-payment"),
    path("orders/<str:public_id>/ledger/", OrderLedgerView.as_view(), name="order-ledger"),
    path("<uuid:payment_id>/capture/", CapturePaymentView.as_view(), name="payment-capture"),
]
