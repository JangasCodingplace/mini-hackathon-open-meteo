from datetime import datetime
from uuid import uuid4

import pytz
import requests
from django.conf import settings
from django.db import models
from django.template import loader
from django.utils.timezone import timedelta
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

# Codes are taken from https://gist.github.com/stellasphere/9490c195ed2b53c707087c8c2db4ec0c
WMO_WEATHER_CODE_MAPPING = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    56: "Light Freezing Drizzle",
    57: "Freezing Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Freezing Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Light Showers",
    81: "Showers",
    82: "Heavy Showers",
    85: "Light Snow Showers",
    86: "Snow Showers",
    95: "Thunderstorm",
    96: "Light Thunderstorms With Hail",
    99: "Thunderstorm With Hail",
}


class Location(models.Model):
    country = models.CharField(max_length=1024)
    city = models.CharField(max_length=1024)
    timestamp = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        unique_together = ("city", "country")

    def __str__(self):
        return f"{self.city}, {self.country}"


class LocationDetailsManager(models.Manager):
    def get_or_create_w_blank_lat_long(self, location: Location, zip_code: str | None = None):
        try:
            obj = self.get(
                location=location,
                zip_code=zip_code,
            )
        except self.model.DoesNotExist:
            pass
        else:
            return obj, False

        address = f"{location.city}, {location.country}"
        if zip_code:
            address = f"{zip_code}, {address}"
        geolocator = Nominatim(user_agent="open-meteo-hackathon")
        geo_location = geolocator.geocode(address)
        tf = TimezoneFinder()
        timezone_str = tf.timezone_at(lat=geo_location.latitude, lng=geo_location.longitude)
        return (
            self.create(
                location=location,
                zip_code=zip_code,
                latitude=geo_location.latitude,
                longitude=geo_location.longitude,
                timezone=timezone_str,
            ),
            True,
        )


class LocationDetails(models.Model):
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="location_details",
    )
    zip_code = models.CharField(max_length=30, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    timezone = models.CharField(max_length=1024)
    timestamp = models.DateTimeField(
        auto_now_add=True,
    )

    objects = LocationDetailsManager()

    class Meta:
        unique_together = ("latitude", "longitude", "zip_code")

    def __str__(self):
        base = f"{self.location.city}, {self.location.country}"
        if self.zip_code:
            return f"{self.zip_code} {base}"
        return base


class Trip(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid4,
        editable=False,
    )
    start_date = models.DateField()
    end_date = models.DateField()
    destination = models.ForeignKey(
        LocationDetails,
        on_delete=models.CASCADE,
        related_name="trips",
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
    )
    preferences = models.TextField(blank=True)

    @property
    def duration(self):
        return (self.end_date - self.start_date).days

    def __str__(self):
        return (
            f"{self.destination.location.city}, {self.destination.location.country} "
            f"from {self.start_date} to {self.end_date}"
        )


class WeatherSeriesManager(models.Manager):
    def create_series(self, trip: Trip):
        params = {
            "latitude": trip.destination.latitude,
            "longitude": trip.destination.longitude,
            "start_date": trip.start_date.strftime("%Y-%m-%d"),
            "end_date": trip.end_date.strftime("%Y-%m-%d"),
            "timezone": trip.destination.timezone,
            "hourly": "temperature_2m,weather_code",
        }
        response = requests.get(
            f"{settings.OPEN_METEO["url"]}/forecast",
            params=params,  # type: ignore
        )
        data = response.json()
        hourly_data = [
            {
                "dt": (pytz.timezone("UTC").localize(datetime.fromisoformat(dt))),
                "temperature": temp,
                "wmo_weather_code": code,
            }
            for dt, temp, code in zip(
                data["hourly"]["time"],
                data["hourly"]["temperature_2m"],
                data["hourly"]["weather_code"],
            )
        ]
        series = [WeatherSeries(trip=trip, **item) for item in hourly_data]
        self.bulk_create(series)
        return series


class WeatherSeries(models.Model):
    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name="weather_series",
    )
    dt = models.DateTimeField()
    temperature = models.DecimalField(max_digits=5, decimal_places=2)
    wmo_weather_code = models.CharField(
        max_length=3,
        choices=[(str(k), v) for k, v in WMO_WEATHER_CODE_MAPPING.items()],
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
    )

    objects = WeatherSeriesManager()

    class Meta:
        unique_together = ("trip", "dt")

    def __str__(self):
        return f"{self.trip} at {self.dt}"


class TripAdviseManager(models.Manager):
    def _get_identity_prompt(self):
        return loader.render_to_string(
            template_name="prompts/identity_prompt.txt",
        )

    def _get_initial_prompt(self, trip: Trip):
        return loader.render_to_string(
            template_name="prompts/initial_prompt.txt",
            context={
                "trip": trip,
                "weather_series": trip.weather_series.order_by("dt"),
            },
        )

    def _perform_prompt(self, payload: dict):
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENAI['secret_key']}",
            },
            json=payload,
        )
        data = response.json()["choices"][0]["message"]["content"]
        return data

    def perform_day_advise(self, advice: "TripAdvise"):
        series_subset = advice.trip.weather_series.filter(
            dt__range=(advice.trip.start_date, advice.trip.start_date + timedelta(days=1))
        )
        previous_advices = advice.trip.advises.filter(
            type="1",
            trip=advice.trip,
            state="2",
        )
        day_prompt = loader.render_to_string(
            template_name="prompts/day_prompt.txt",
            context={
                "trip": advice.trip,
                "weather_series": series_subset.order_by("dt"),
                "day_number": (advice.for_date - advice.trip.start_date).days,
                "advice": advice,
                "activities": list(previous_advices.order_by("for_date").all()),
            },
        )
        openai_payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": self._get_identity_prompt(),
                },
                {
                    "role": "system",
                    "content": self._get_initial_prompt(advice.trip),
                },
                {
                    "role": "system",
                    "content": day_prompt,
                },
            ],
        }
        ai_advice = self._perform_prompt(openai_payload)
        advice.advise = ai_advice
        advice.state = "2"
        advice.save()
        return advice

    def create_advise_set(self, trip: Trip):
        for day in range(trip.duration + 1):
            advise = self.create(
                trip=trip,
                type="1",
                for_date=trip.start_date + timedelta(days=day),
                state="1",
            )
            self.perform_day_advise(advise)
        return trip


class TripAdvise(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid4,
        editable=False,
    )
    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name="advises",
    )
    advise = models.TextField(
        blank=True,
    )
    type = models.CharField(
        max_length=20,
        choices=[
            ("1", "Activity"),
            ("2", "Tip"),
        ],
    )
    for_date = models.DateField(
        blank=True,
        null=True,
    )
    state = models.CharField(
        max_length=2,
        choices=[
            ("1", "Pending"),
            ("2", "Completed"),
            ("3", "Failed"),
        ],
        default="1",
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
    )
    timestamp_updated = models.DateTimeField(
        auto_now=True,
    )
    objects = TripAdviseManager()

    def __str__(self):
        return f"Advise for {self.trip}"

    @property
    def weather_series(self):
        if not self.for_date:
            return self.trip.weather_series
        return self.trip.weather_series.filter(
            dt__range=(self.for_date, self.for_date + timedelta(days=1)),
        )
