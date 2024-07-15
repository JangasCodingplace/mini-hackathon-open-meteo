from threading import Thread

from django.apps import AppConfig


class TripConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.Trip"

    def ready(self):
        from . import signals  # noqa
        from .thread_functions import trip_advisor_thread, weather_thread

        Thread(target=weather_thread, daemon=True).start()
        Thread(target=trip_advisor_thread, daemon=True).start()
