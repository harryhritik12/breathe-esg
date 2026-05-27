from django.contrib import admin
from .models import Client, IngestionBatch, EmissionRow, AuditLog

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']

@admin.register(IngestionBatch)
class IngestionBatchAdmin(admin.ModelAdmin):
    list_display = ['client', 'source_type', 'status', 'uploaded_at', 'row_count', 'error_count']

@admin.register(EmissionRow)
class EmissionRowAdmin(admin.ModelAdmin):
    list_display = ['client', 'scope', 'category', 'quantity', 'unit', 'co2e_kg', 'status', 'period_start', 'period_end']
    list_filter = ['scope', 'status', 'client']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['emission_row', 'action', 'performed_by', 'performed_at']