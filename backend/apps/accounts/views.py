from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .tokens import EmailTokenObtainPairSerializer

from apps.audit.services import log_audit

from .serializers import (
    AdminUserCreateSerializer,
    AdminUserListSerializer,
    AppleAuthSerializer,
    GoogleAuthSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserPublicSerializer,
)
from . import social as social_auth
from .push_models import PushDevice

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_audit(
            actor=None,
            action="user.register",
            target_type="user",
            target_id=str(user.id),
            ip=request.META.get("REMOTE_ADDR"),
            metadata={"email": user.email},
        )
        return Response(UserPublicSerializer(user).data, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserPublicSerializer

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        ser = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(UserPublicSerializer(request.user).data)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)


class PushTokenView(APIView):
    """Enregistre le token Expo Push pour notifications hors app."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = str(request.data.get("token") or "").strip()
        if not token.startswith("ExponentPushToken"):
            return Response({"detail": "Token Expo Push invalide."}, status=status.HTTP_400_BAD_REQUEST)
        platform = str(request.data.get("platform") or "").strip()[:20]
        PushDevice.objects.update_or_create(
            expo_push_token=token,
            defaults={"user": request.user, "platform": platform},
        )
        return Response({"ok": True})

    def delete(self, request):
        token = str(request.data.get("token") or "").strip()
        if token:
            PushDevice.objects.filter(user=request.user, expo_push_token=token).delete()
        else:
            PushDevice.objects.filter(user=request.user).delete()
        return Response({"ok": True})


class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        role = request.query_params.get("role", "")
        qs = User.objects.all()
        if role:
            qs = qs.filter(role=role)
        serializer = AdminUserListSerializer(qs, many=True)
        return Response(serializer.data)


class AdminUserCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "admin":
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        serializer = AdminUserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            log_audit(
                actor=request.user,
                action="admin.user.create",
                target_type="user",
                target_id=str(user.id),
                metadata={"email": user.email, "role": user.role},
            )
            return Response(AdminUserListSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def delete(self, request, pk):
        if request.user.role != "admin":
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        user = self.get_object(pk)
        if not user:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if user.role == "admin":
            return Response({"detail": "Impossible de supprimer un administrateur."}, status=status.HTTP_400_BAD_REQUEST)
        log_audit(
            actor=request.user,
            action="admin.user.delete",
            target_type="user",
            target_id=str(user.id),
            metadata={"email": user.email, "role": user.role},
        )
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            log_audit(
                actor=None,
                action="auth.login_success",
                target_type="auth",
                target_id=request.data.get("email", ""),
                ip=request.META.get("REMOTE_ADDR"),
            )
        return response


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


def _jwt_response_for_user(user, request, action: str) -> Response:
    refresh = RefreshToken.for_user(user)
    log_audit(
        actor=user,
        action=action,
        target_type="user",
        target_id=str(user.id),
        ip=request.META.get("REMOTE_ADDR"),
        metadata={"email": user.email},
    )
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserPublicSerializer(user).data,
        },
        status=status.HTTP_200_OK,
    )


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        ser = GoogleAuthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            user = social_auth.user_from_google(ser.validated_data["id_token"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return _jwt_response_for_user(user, request, "auth.google_login")


class AppleAuthView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        ser = AppleAuthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            user = social_auth.user_from_apple(
                ser.validated_data["identity_token"],
                ser.validated_data.get("full_name"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return _jwt_response_for_user(user, request, "auth.apple_login")
