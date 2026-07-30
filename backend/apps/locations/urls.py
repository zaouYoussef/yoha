from django.urls import path
from .views import UpdateCourierLocationView, LatestCourierLocationView

urlpatterns = [
    path('update/', UpdateCourierLocationView.as_view(), name='courier-location-update'),
    path('order/<int:order_id>/', LatestCourierLocationView.as_view(), name='courier-location-order'),
    path('latest/', LatestCourierLocationView.as_view(), name='courier-location-latest'),
]
