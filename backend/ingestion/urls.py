from django.urls import path
from .views import UploadSAPView, UploadUtilityView, UploadTravelView

urlpatterns = [
    path('upload/sap/', UploadSAPView.as_view(), name='upload-sap'),
    path('upload/utility/', UploadUtilityView.as_view(), name='upload-utility'),
    path('upload/travel/', UploadTravelView.as_view(), name='upload-travel'),
]