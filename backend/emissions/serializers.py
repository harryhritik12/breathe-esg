from rest_framework import serializers
from .models import Client, IngestionBatch, EmissionRow, AuditLog


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class IngestionBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionBatch
        fields = '__all__'


class EmissionRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmissionRow
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'