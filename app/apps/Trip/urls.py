from django.urls import path

from . import views

urlpatterns = [
    path("create", views.TripCreateView.as_view()),
    path("retrieve/<pk>", views.TripRetrieveView.as_view()),
]
