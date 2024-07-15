from rest_framework.generics import CreateAPIView, RetrieveAPIView

from . import models, serializers


class TripCreateView(CreateAPIView):
    queryset = models.Trip.objects
    serializer_class = serializers.TripSerializer


class TripRetrieveView(RetrieveAPIView):
    queryset = models.Trip.objects
    serializer_class = serializers.TripSerializer
