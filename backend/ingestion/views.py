import csv
import io
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from emissions.models import Client, IngestionBatch, EmissionRow


class UploadSAPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        file = request.FILES.get('file')
        client_id = request.data.get('client_id')

        if not file or not client_id:
            return Response({'error': 'file and client_id required'}, status=400)

        client = Client.objects.get(id=client_id)
        decoded = file.read().decode('utf-8', errors='replace')
        reader = csv.DictReader(io.StringIO(decoded))

        batch = IngestionBatch.objects.create(
            client=client,
            source_type='sap',
            uploaded_by=None,
            file_name=file.name,
        )

        rows = []
        errors = 0
        for row in reader:
            try:
                EmissionRow.objects.create(
                    batch=batch,
                    client=client,
                    scope='scope1',
                    category=row.get('material_type', 'unknown'),
                    quantity=float(row.get('quantity', 0)),
                    unit=normalize_unit(row.get('unit', 'L')),
                    raw_data=dict(row),
                    period_start=parse_date(row.get('posting_date', '2024-01-01')),
                    period_end=parse_date(row.get('posting_date', '2024-01-31')),
                )
                rows.append(row)
            except Exception as e:
                errors += 1

        batch.row_count = len(rows)
        batch.error_count = errors
        batch.save()

        return Response({'batch_id': batch.id, 'rows': len(rows), 'errors': errors})


class UploadUtilityView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        file = request.FILES.get('file')
        client_id = request.data.get('client_id')

        if not file or not client_id:
            return Response({'error': 'file and client_id required'}, status=400)

        client = Client.objects.get(id=client_id)
        decoded = file.read().decode('utf-8', errors='replace')
        reader = csv.DictReader(io.StringIO(decoded))

        batch = IngestionBatch.objects.create(
            client=client,
            source_type='utility',
            uploaded_by=None,
            file_name=file.name,
        )

        rows = []
        errors = 0
        for row in reader:
            try:
                EmissionRow.objects.create(
                    batch=batch,
                    client=client,
                    scope='scope2',
                    category='electricity',
                    quantity=float(row.get('consumption_kwh', 0)),
                    unit='kWh',
                    raw_data=dict(row),
                    period_start=parse_date(row.get('billing_start', '2024-01-01')),
                    period_end=parse_date(row.get('billing_end', '2024-01-31')),
                )
                rows.append(row)
            except Exception as e:
                errors += 1

        batch.row_count = len(rows)
        batch.error_count = errors
        batch.save()

        return Response({'batch_id': batch.id, 'rows': len(rows), 'errors': errors})


class UploadTravelView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        file = request.FILES.get('file')
        client_id = request.data.get('client_id')

        if not file or not client_id:
            return Response({'error': 'file and client_id required'}, status=400)

        client = Client.objects.get(id=client_id)
        decoded = file.read().decode('utf-8', errors='replace')
        reader = csv.DictReader(io.StringIO(decoded))

        batch = IngestionBatch.objects.create(
            client=client,
            source_type='travel',
            uploaded_by=None,
            file_name=file.name,
        )

        rows = []
        errors = 0
        for row in reader:
            try:
                EmissionRow.objects.create(
                    batch=batch,
                    client=client,
                    scope='scope3',
                    category=row.get('travel_type', 'flight'),
                    quantity=float(row.get('distance_km', 0)),
                    unit='km',
                    raw_data=dict(row),
                    period_start=parse_date(row.get('travel_date', '2024-01-01')),
                    period_end=parse_date(row.get('travel_date', '2024-01-31')),
                )
                rows.append(row)
            except Exception as e:
                errors += 1

        batch.row_count = len(rows)
        batch.error_count = errors
        batch.save()

        return Response({'batch_id': batch.id, 'rows': len(rows), 'errors': errors})


def normalize_unit(unit):
    unit = unit.strip().upper()
    mapping = {
        'L': 'L', 'LTR': 'L', 'LITRE': 'L', 'LITER': 'L',
        'KG': 'kg', 'KGS': 'kg',
        'KWH': 'kWh', 'KW/H': 'kWh',
        'KM': 'km', 'KMS': 'km',
    }
    return mapping.get(unit, unit)


def parse_date(date_str):
    from datetime import datetime
    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d.%m.%Y', '%m/%d/%Y']:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except:
            continue
    return datetime(2024, 1, 1).date()