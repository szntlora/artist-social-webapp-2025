from django.urls import path
from .views import (
    ArtworkListCreateView,
    ArtworkRetrieveUpdateDestroyView,
    GlobalSearchView,
    SearchSuggestions,
    report_artwork,
)

urlpatterns = [
    path('', ArtworkListCreateView.as_view(), name='artwork-list-create'),
    path('<int:pk>/', ArtworkRetrieveUpdateDestroyView.as_view(), name='artwork-detail'),
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('search-suggestions/', SearchSuggestions.as_view(), name='search-suggestions'),  
    path('report/<int:pk>/', report_artwork, name='report-artwork'),
]
