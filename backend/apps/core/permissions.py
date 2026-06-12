from rest_framework.permissions import BasePermission


class IsRole(BasePermission):
    """Autorise uniquement les rôles listés sur la vue."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        allowed = getattr(view, "allowed_roles", None)
        if not allowed:
            return True
        return request.user.role in allowed


class IsAdmin(IsRole):
    def has_permission(self, request, view):
        view.allowed_roles = ("admin",)
        return super().has_permission(request, view)


class IsCourier(IsRole):
    def has_permission(self, request, view):
        view.allowed_roles = ("courier", "admin")
        return super().has_permission(request, view)


class IsRestaurant(IsRole):
    def has_permission(self, request, view):
        view.allowed_roles = ("restaurant", "admin")
        return super().has_permission(request, view)


class IsClient(IsRole):
    def has_permission(self, request, view):
        view.allowed_roles = ("client", "admin")
        return super().has_permission(request, view)
