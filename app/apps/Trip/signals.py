from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Trip, TripAdvise
from .thread_functions import trip_queue


@receiver(post_save, sender=Trip)
def add_trip_to_queue(instance, created, **kwargs):
    if not created:
        return
    trip_queue.put(instance)


@receiver(post_save, sender=TripAdvise)
def add_advise_to_queue(instance, created, **kwargs):
    if not created:
        return
    if instance.state != "1":
        return
    trip_queue.put(instance)
