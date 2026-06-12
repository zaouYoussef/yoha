from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.core.permissions import IsAdmin
from apps.orders.models import Order

from .models import LedgerEntry, Payment
from .serializers import LedgerEntrySerializer, PaymentSerializer
from .services import capture_cod_payment


class OrderPaymentView(generics.RetrieveAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PaymentSerializer

    def get_object(self):
        order = get_object_or_404(Order, public_id=self.kwargs["public_id"])
        return get_object_or_404(Payment, order=order)


class OrderLedgerView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = LedgerEntrySerializer

    def get_queryset(self):
        order = get_object_or_404(Order, public_id=self.kwargs["public_id"])
        payment = get_object_or_404(Payment, order=order)
        return payment.ledger_entries.all()


class CapturePaymentView(APIView):
    """Marquer un paiement COD comme encaissé (admin)."""

    permission_classes = [IsAdmin]

    def post(self, request, payment_id):
        payment = get_object_or_404(Payment, pk=payment_id)
        payment = capture_cod_payment(payment=payment)
        return Response(PaymentSerializer(payment).data)
