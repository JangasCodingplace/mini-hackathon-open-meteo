from django.urls import include, path

urlpatterns = [
    path("trip/", include("apps.Trip.urls")),
]
