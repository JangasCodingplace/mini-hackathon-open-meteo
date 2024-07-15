from queue import Queue

from .models import Trip, TripAdvise, WeatherSeries

trip_queue: Queue[Trip] = Queue()
dlq_trip_queue: Queue[tuple[Trip, str]] = Queue()

advise_queue: Queue[TripAdvise] = Queue()
dlq_advise_queue: Queue[tuple[TripAdvise, str]] = Queue()


def weather_thread():
    """Weather data thread for the FastAPI application."""
    while True:
        trip = trip_queue.get()
        try:
            WeatherSeries.objects.create_series(trip)
        except Exception as exc:
            dlq_trip_queue.put((trip, str(exc)))
        else:
            TripAdvise.objects.create_advise_set(trip)
        finally:
            trip_queue.task_done()


def trip_advisor_thread():
    while True:
        advise = advise_queue.get()
        try:
            if advise.type == "1":
                TripAdvise.objects.perform_day_advise(advise)
        except Exception as exc:
            dlq_advise_queue.put((advise, str(exc)))
        finally:
            advise_queue.task_done()
