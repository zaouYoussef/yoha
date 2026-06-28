from django.urls import path

from .views import (
    AdminCourierDeleteView,
    AssignCourierView,
    AutoDispatchView,
    CheckoutView,
    ClaimOrderView,
    ClaimOrdersView,
    CourierListView,
    GuestOrdersView,
    OrderPushSubscribeView,
    OrderDetailView,
    OrderListView,
    OrderReadyView,
    OrderStatusView,
    SendToRestaurantView,
)

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("claim/", ClaimOrdersView.as_view(), name="order-claim"),
    path("guest/", GuestOrdersView.as_view(), name="order-guest-batch"),
    path("push-subscribe/", OrderPushSubscribeView.as_view(), name="order-push-subscribe"),
    path("", OrderListView.as_view(), name="order-list"),
    path("couriers/", CourierListView.as_view(), name="courier-list"),
    path("couriers/<int:pk>/", AdminCourierDeleteView.as_view(), name="admin-courier-delete"),
    path("<str:public_id>/", OrderDetailView.as_view(), name="order-detail"),
    path("<str:public_id>/status/", OrderStatusView.as_view(), name="order-status"),
    path("<str:public_id>/dispatch/", AutoDispatchView.as_view(), name="order-dispatch"),
    path("<str:public_id>/ready/", OrderReadyView.as_view(), name="order-ready"),
    path("<str:public_id>/claim/", ClaimOrderView.as_view(), name="order-claim-courier"),
    path("<str:public_id>/assign-courier/", AssignCourierView.as_view(), name="order-assign"),
    path("<str:public_id>/send-to-restaurant/", SendToRestaurantView.as_view(), name="order-send-to-restaurant"),
]
