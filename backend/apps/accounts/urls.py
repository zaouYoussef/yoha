from django.urls import path

from .views import (
    AppleAuthView,
    GoogleAuthView,
    MeView,
    ProfileView,
    PushTokenView,
    RegisterView,
    ThrottledTokenObtainPairView,
    ThrottledTokenRefreshView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("google/", GoogleAuthView.as_view(), name="google_auth"),
    path("apple/", AppleAuthView.as_view(), name="apple_auth"),
    path("login/", ThrottledTokenObtainPairView.as_view(), name="token_obtain"),
    path("refresh/", ThrottledTokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("push-token/", PushTokenView.as_view(), name="push_token"),
]
