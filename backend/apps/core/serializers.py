from rest_framework import serializers
from .models import AnalyticsEvent


class AnalyticsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsEvent
        fields = (
            "category", "label", "path", "referrer",
            "user_agent", "metadata", "duration_ms",
        )


class AnalyticsDashboardSerializer(serializers.Serializer):
    total_pageviews = serializers.IntegerField()
    unique_visitors = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    avg_duration_seconds = serializers.FloatField()
    top_pages = serializers.ListField(child=serializers.DictField())
    top_restaurants = serializers.ListField(child=serializers.DictField())
    daily_views = serializers.ListField(child=serializers.DictField())
    recent_events = serializers.ListField(child=serializers.DictField())
