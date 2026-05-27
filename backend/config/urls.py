from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
import json

def csrf_view(request):
    return JsonResponse({'csrfToken': get_token(request)})

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = authenticate(username=data['username'], password=data['password'])
        if user:
            login(request, user)
            return JsonResponse({'message': 'logged in'})
        return JsonResponse({'error': 'invalid credentials'}, status=401)

@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({'message': 'logged out'})
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/csrf/', csrf_view),  # ← added this
    path('api/auth/login/', login_view),
    path('api/auth/logout/', logout_view),
    path('api/ingest/', include('ingestion.urls')),
    path('api/analyst/', include('analyst.urls')),
]