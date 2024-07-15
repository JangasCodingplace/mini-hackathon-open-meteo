from django.utils.timezone import timedelta
from rest_framework import serializers

from . import models


class TripWeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.WeatherSeries
        fields = (
            "dt",
            "temperature",
            "wmo_weather_code",
        )


class TripAdviceSerializer(serializers.ModelSerializer):
    weather_series = TripWeatherSerializer(many=True, read_only=True)

    class Meta:
        model = models.TripAdvise
        fields = (
            "id",
            "advise",
            "type",
            "for_date",
            "state",
            "timestamp",
            "timestamp_updated",
            "weather_series",
        )


class TripSerializer(serializers.ModelSerializer):
    city = serializers.CharField(source="destination.location.city")
    country = serializers.CharField(source="destination.location.country")
    zip_code = serializers.CharField(source="destination.zip_code", allow_blank=True)
    duration = serializers.IntegerField(min_value=1, max_value=5)

    advises = TripAdviceSerializer(many=True, read_only=True)

    class Meta:
        model = models.Trip
        fields = (
            "id",
            "start_date",
            "duration",
            "end_date",
            "preferences",
            "city",
            "country",
            "zip_code",
            "advises",
        )
        extra_kwargs = {
            "end_date": {"read_only": True},
        }

    def create(self, validated_data):
        location, _ = models.Location.objects.get_or_create(
            city=validated_data["destination"]["location"]["city"],
            country=validated_data["destination"]["location"]["country"],
        )
        location_details, _ = models.LocationDetails.objects.get_or_create_w_blank_lat_long(
            location=location,
            zip_code=validated_data["destination"]["zip_code"],
        )
        end_date = validated_data["start_date"] + timedelta(days=validated_data["duration"])
        trip = models.Trip.objects.create(
            start_date=validated_data["start_date"],
            end_date=end_date,
            preferences=validated_data["preferences"],
            destination=location_details,
        )
        return trip
