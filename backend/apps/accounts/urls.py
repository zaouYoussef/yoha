from django.urls import path

from .views import (
    AdminUserCreateView,
    AdminUserDetailView,
    AdminUserListView,
    AppleAuthView,
    GoogleAuthView,
    MeView,
    ProfileView,
    PushTokenView,
    RegisterView,
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
    UserRequestView,
)
from .web_push_views import VapidPublicKeyView, WebPushSubscribeView, WebPushUnsubscribeView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("google/", GoogleAuthView.as_view(), name="google_auth"),
    path("apple/", AppleAuthView.as_view(), name="apple_auth"),
    path("login/", ThrottledTokenObtainPairView.as_view(), name="token_obtain"),
    path("refresh/", ThrottledTokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("push-token/", PushTokenView.as_view(), name="push_token"),
    path("youssef/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("youssef/users/create/", AdminUserCreateView.as_view(), name="admin-user-create"),
    path("youssef/users/<uuid:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("push/web/vapid-key/", VapidPublicKeyView.as_view(), name="vapid-public-key"),
    path("push/web/subscribe/", WebPushSubscribeView.as_view(), name="web-push-subscribe"),
    path("push/web/unsubscribe/", WebPushUnsubscribeView.as_view(), name="web-push-unsubscribe"),
    path("requests/", UserRequestView.as_view(), name="user-requests"),
]
