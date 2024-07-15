from django.contrib import admin

from . import models


class LocationDetailsInline(admin.TabularInline):
    model = models.LocationDetails
    extra = 0


@admin.register(models.Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("__str__", "timestamp")
    inlines = [LocationDetailsInline]


class TripInline(admin.TabularInline):
    model = models.Trip
    extra = 0


@admin.register(models.LocationDetails)
class LocationDetailsAdmin(admin.ModelAdmin):
    list_display = ("__str__", "timestamp")
    inlines = [TripInline]


class WeatherSeriesInline(admin.TabularInline):
    model = models.WeatherSeries
    extra = 0


class TripAdviseInline(admin.TabularInline):
    model = models.TripAdvise
    extra = 0


@admin.register(models.Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("id", "__str__", "start_date", "end_date", "timestamp")
    inlines = [WeatherSeriesInline, TripAdviseInline]


@admin.register(models.WeatherSeries)
class WeatherSeriesAdmin(admin.ModelAdmin):
    list_display = ("__str__", "timestamp")


@admin.register(models.TripAdvise)
class TripAdviseAdmin(admin.ModelAdmin):
    list_display = ("__str__", "id", "type", "state", "timestamp", "timestamp_updated")
    list_filter = ("type", "state")
