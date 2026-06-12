import uuid

from django.http import Http404
from django.utils.text import slugify
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.exceptions import ValidationError
from apps.core.media import ImageProcessingError, process_and_store
from apps.core.permissions import IsRestaurant

from .models import MenuCategory, MenuItem, Restaurant
from .serializers import (
    MenuCategoryWriteSerializer,
    MenuItemWriteSerializer,
    RestaurantCreateSerializer,
    RestaurantDetailSerializer,
    RestaurantListSerializer,
    RestaurantWriteSerializer,
)
from .services import menu_item_image_keys


def get_owned_restaurant(user):
    if user.restaurant_profile_id:
        return user.restaurant_profile
    return None


class RestaurantListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []
    serializer_class = RestaurantListSerializer
    pagination_class = None

    def get_queryset(self):
        qs = Restaurant.objects.filter(is_active=True)
        cuisine = self.request.query_params.get("cuisine")
        if cuisine:
            qs = qs.filter(cuisine=cuisine)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)
        return qs


class RestaurantDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []
    serializer_class = RestaurantDetailSerializer
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    queryset = Restaurant.objects.filter(is_active=True)


class MyRestaurantView(generics.RetrieveUpdateAPIView):
    """Dashboard restaurant — lecture et mise à jour du profil."""

    permission_classes = [IsRestaurant]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return RestaurantWriteSerializer
        return RestaurantDetailSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["manage"] = True
        return ctx

    def get_object(self):
        resto = get_owned_restaurant(self.request.user)
        if not resto:
            raise Http404
        return resto

    def perform_update(self, serializer):
        serializer.save()


class MyRestaurantCreateView(generics.CreateAPIView):
    """Créer un établissement si le compte n'en a pas encore."""

    permission_classes = [IsRestaurant]
    serializer_class = RestaurantCreateSerializer

    def create(self, request, *args, **kwargs):
        if get_owned_restaurant(request.user):
            return Response(
                {"detail": "Vous avez déjà un restaurant rattaché."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        slug = data.pop("slug", None) or slugify(data["name"])
        base_slug = slug
        n = 1
        while Restaurant.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{n}"
            n += 1
        resto = Restaurant.objects.create(
            slug=slug,
            owner=request.user,
            tags=data.get("tags") or [data["cuisine"].capitalize()],
            **data,
        )
        return Response(
            RestaurantDetailSerializer(resto).data,
            status=status.HTTP_201_CREATED,
        )


class RestaurantMediaUploadView(APIView):
    """Upload cover ou logo — WebP compressé, stockage objet."""

    permission_classes = [IsRestaurant]
    parser_classes = [MultiPartParser, FormParser]

    ALLOWED_FIELDS = frozenset({"cover", "logo"})

    def post(self, request):
        resto = get_owned_restaurant(request.user)
        if not resto:
            raise Http404

        field = (request.data.get("field") or "").strip().lower()
        if field not in self.ALLOWED_FIELDS:
            raise ValidationError("Champ requis: field=cover ou field=logo.")

        uploaded = request.FILES.get("file")
        if not uploaded:
            raise ValidationError("Fichier image requis (file).")

        try:
            stored = process_and_store(
                uploaded,
                folder=f"restaurants/{resto.pk}",
                purpose=field,
            )
        except ImageProcessingError as exc:
            raise ValidationError(str(exc)) from exc

        if field == "cover":
            from apps.core.media import delete_stored_keys

            delete_stored_keys(resto.cover_file, resto.cover_thumb)
            resto.cover_file = stored.key
            resto.cover_thumb = stored.thumb_key
            resto.cover_url = stored.url
            resto.save(update_fields=["cover_file", "cover_thumb", "cover_url", "updated_at"])
        else:
            from apps.core.media import delete_stored_keys

            delete_stored_keys(resto.logo_file, resto.logo_thumb)
            resto.logo_file = stored.key
            resto.logo_thumb = stored.thumb_key
            resto.logo_url = stored.url
            resto.save(update_fields=["logo_file", "logo_thumb", "logo_url", "updated_at"])

        return Response(
            {
                "field": field,
                "url": stored.url,
                "thumb_url": stored.thumb_url,
                "width": stored.width,
                "height": stored.height,
            },
            status=status.HTTP_201_CREATED,
        )


class MenuCategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsRestaurant]
    serializer_class = MenuCategoryWriteSerializer

    def get_queryset(self):
        resto = get_owned_restaurant(self.request.user)
        if not resto:
            raise Http404
        return resto.menu_categories.all()

    def perform_create(self, serializer):
        resto = get_owned_restaurant(self.request.user)
        if not resto:
            raise Http404
        serializer.save(restaurant=resto)


class MenuCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsRestaurant]
    serializer_class = MenuCategoryWriteSerializer

    def get_queryset(self):
        resto = get_owned_restaurant(self.request.user)
        if not resto:
            raise Http404
        return resto.menu_categories.all()


class MenuItemListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsRestaurant]
    serializer_class = MenuItemWriteSerializer

    def get_queryset(self):
        resto = get_owned_restaurant(self.request.user)
        if not resto:
            raise Http404
        return resto.menu_items.select_related("category")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["restaurant"] = get_owned_restaurant(self.request.user)
        return ctx

    def perform_create(self, serializer):
        resto = get_owned_restaurant(self.request.user)
        if not resto:
            raise Http404
        category_id = self.request.data.get("category_id")
        if not category_id:
            raise ValidationError("category_id requis.")
        try:
            category = resto.menu_categories.get(pk=category_id)
        except MenuCategory.DoesNotExist as exc:
            raise ValidationError("Catégorie introuvable.") from exc

        ext_id = serializer.validated_data.get("external_id") or f"item-{uuid.uuid4().hex[:8]}"
        serializer.save(restaurant=resto, category=category, external_id=ext_id)


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsRestaurant]
    serializer_class = MenuItemWriteSerializer

    def get_queryset(self):
        resto = get_owned_restaurant(self.request.user)
        if not resto:
            raise Http404
        return resto.menu_items.all()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["restaurant"] = get_owned_restaurant(self.request.user)
        return ctx

    def perform_destroy(self, instance):
        from apps.core.media import delete_stored_keys

        delete_stored_keys(*menu_item_image_keys(instance))
        instance.delete()


class MenuItemImageUploadView(APIView):
    permission_classes = [IsRestaurant]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        resto = get_owned_restaurant(request.user)
        if not resto:
            raise Http404
        try:
            item = resto.menu_items.get(pk=pk)
        except MenuItem.DoesNotExist as exc:
            raise Http404 from exc

        uploaded = request.FILES.get("file")
        if not uploaded:
            raise ValidationError("Fichier image requis (file).")

        try:
            stored = process_and_store(
                uploaded,
                folder=f"menu-items/{item.pk}",
                purpose="menu",
            )
        except ImageProcessingError as exc:
            raise ValidationError(str(exc)) from exc

        from apps.core.media import delete_stored_keys

        delete_stored_keys(*menu_item_image_keys(item))
        item.image_file = stored.key
        item.image_thumb = stored.thumb_key
        item.image_url = stored.url
        item.save(update_fields=["image_file", "image_thumb", "image_url"])

        return Response(
            {
                "url": stored.url,
                "thumb_url": stored.thumb_url,
                "width": stored.width,
                "height": stored.height,
            },
            status=status.HTTP_201_CREATED,
        )
