from django.urls import path
from .views import (
    EmissionRowListView, ApproveRowView,
    RejectRowView, FlagRowView,
    BatchListView, DashboardStatsView
)

urlpatterns = [
    path('rows/', EmissionRowListView.as_view(), name='rows-list'),
    path('rows/<int:row_id>/approve/', ApproveRowView.as_view(), name='approve-row'),
    path('rows/<int:row_id>/reject/', RejectRowView.as_view(), name='reject-row'),
    path('rows/<int:row_id>/flag/', FlagRowView.as_view(), name='flag-row'),
    path('batches/', BatchListView.as_view(), name='batch-list'),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]