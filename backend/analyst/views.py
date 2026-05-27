from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from emissions.models import EmissionRow, AuditLog, IngestionBatch
from emissions.serializers import EmissionRowSerializer, IngestionBatchSerializer


def update_batch_status(batch):
    rows = EmissionRow.objects.filter(batch=batch)
    total = rows.count()
    pending = rows.filter(status='pending').count()
    rejected = rows.filter(status='rejected').count()

    if total > 0 and pending == 0:
        if rejected == 0:
            batch.status = 'approved'
        else:
            batch.status = 'rejected'
        batch.save()


class EmissionRowListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        status_filter = request.query_params.get('status', None)
        scope_filter = request.query_params.get('scope', None)
        client_filter = request.query_params.get('client_id', None)

        rows = EmissionRow.objects.all().order_by('-created_at')

        if status_filter:
            rows = rows.filter(status=status_filter)
        if scope_filter:
            rows = rows.filter(scope=scope_filter)
        if client_filter:
            rows = rows.filter(client_id=client_filter)

        serializer = EmissionRowSerializer(rows, many=True)
        return Response(serializer.data)


class ApproveRowView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, row_id):
        try:
            row = EmissionRow.objects.get(id=row_id)
            row.status = 'approved'
            row.reviewed_at = timezone.now()
            row.review_note = request.data.get('note', '')
            row.save()

            AuditLog.objects.create(
                emission_row=row,
                action='approved',
                performed_by=None,
                note=row.review_note
            )

            update_batch_status(row.batch)

            return Response({'message': 'Row approved'})
        except EmissionRow.DoesNotExist:
            return Response({'error': 'Row not found'}, status=404)


class RejectRowView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, row_id):
        try:
            row = EmissionRow.objects.get(id=row_id)
            row.status = 'rejected'
            row.reviewed_at = timezone.now()
            row.review_note = request.data.get('note', '')
            row.save()

            AuditLog.objects.create(
                emission_row=row,
                action='rejected',
                performed_by=None,
                note=row.review_note
            )

            update_batch_status(row.batch)

            return Response({'message': 'Row rejected'})
        except EmissionRow.DoesNotExist:
            return Response({'error': 'Row not found'}, status=404)


class FlagRowView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, row_id):
        try:
            row = EmissionRow.objects.get(id=row_id)
            row.status = 'suspicious'
            row.reviewed_at = timezone.now()
            row.review_note = request.data.get('note', '')
            row.save()

            AuditLog.objects.create(
                emission_row=row,
                action='flagged',
                performed_by=None,
                note=row.review_note
            )

            update_batch_status(row.batch)

            return Response({'message': 'Row flagged as suspicious'})
        except EmissionRow.DoesNotExist:
            return Response({'error': 'Row not found'}, status=404)


class BatchListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        batches = IngestionBatch.objects.all().order_by('-uploaded_at')
        serializer = IngestionBatchSerializer(batches, many=True)
        return Response(serializer.data)


class DashboardStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total = EmissionRow.objects.count()
        pending = EmissionRow.objects.filter(status='pending').count()
        approved = EmissionRow.objects.filter(status='approved').count()
        rejected = EmissionRow.objects.filter(status='rejected').count()
        suspicious = EmissionRow.objects.filter(status='suspicious').count()

        return Response({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'suspicious': suspicious,
        })