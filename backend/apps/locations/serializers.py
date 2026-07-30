from rest_framework import serializers
from .models import CourierLocation


class CourierLocationSerializer(serializers.ModelSerializer):
    courier_name = serializers.CharField(source='courier.get_full_name', read_only=True)

    class Meta:
        model = CourierLocation
        fields = [
            'id', 'courier', 'courier_name', 'order',
            'latitude', 'longitude', 'heading', 'speed', 'timestamp'
        ]
        read_only_fields = ['id', 'courier', 'timestamp']
