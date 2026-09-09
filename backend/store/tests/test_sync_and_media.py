import io
import zipfile
from PIL import Image as PILImage
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from model_bakery import baker

from store.models import Collection, Product, ProductImage, GoogleSheetSyncSetting

User = get_user_model()


def create_dummy_image_bytes(format='JPEG'):
    """Create in-memory image bytes for test upload."""
    buffer = io.BytesIO()
    img = PILImage.new('RGB', (50, 50), color='blue')
    img.save(buffer, format=format)
    buffer.seek(0)
    return buffer.getvalue()


@pytest.mark.django_db
class TestCollectionDetailAndProducts:
    """Test collection retrieval, image field, and include_products parameter."""

    def test_retrieve_collection_with_include_products(self, api_client):
        collection = baker.make(Collection, title="Beauty", is_visible=True)
        product1 = baker.make(
            Product,
            collection=collection,
            title="Lipstick Matte",
            unit_price=25.00,
            inventory=10,
            is_visible=True,
            is_photos_published=True
        )
        product2 = baker.make(
            Product,
            collection=collection,
            title="Face Powder",
            unit_price=15.00,
            inventory=5,
            is_visible=True,
            is_photos_published=True
        )

        # Request collection with include_products=true (used by CollectionDetailClient)
        response = api_client.get(f'/store/collections/{collection.id}/?include_products=true')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == collection.id
        assert response.data['title'] == "Beauty"
        assert 'products' in response.data
        assert len(response.data['products']) == 2
        titles = [p['title'] for p in response.data['products']]
        assert "Lipstick Matte" in titles
        assert "Face Powder" in titles

    def test_invisible_collection_hidden_from_anonymous(self, api_client):
        collection = baker.make(Collection, is_visible=False)
        response = api_client.get(f'/store/collections/{collection.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_invisible_collection_visible_to_admin(self, api_client):
        admin_user = User.objects.create_superuser('admin_user', 'admin@example.com', 'password123')
        api_client.force_authenticate(user=admin_user)
        collection = baker.make(Collection, is_visible=False)

        response = api_client.get(f'/store/collections/{collection.id}/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestBulkUploadZip:
    """Test bulk zip media upload permission, file validation, and photo association."""

    def test_zip_upload_requires_admin(self, api_client):
        # Anonymous
        response = api_client.post('/store/products/bulk_upload_zip/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

        # Regular authenticated non-staff user
        regular_user = baker.make(User, is_staff=False)
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/store/products/bulk_upload_zip/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_zip_upload_no_file_provided(self, api_client):
        admin_user = User.objects.create_superuser('admin_zip', 'admin@zip.com', 'password123')
        api_client.force_authenticate(user=admin_user)

        response = api_client.post('/store/products/bulk_upload_zip/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'ZIP file is required' in response.data.get('error', '')

    def test_zip_upload_invalid_file_extension(self, api_client):
        admin_user = User.objects.create_superuser('admin_zip2', 'admin@zip2.com', 'password123')
        api_client.force_authenticate(user=admin_user)

        text_file = SimpleUploadedFile("test.txt", b"plain text", content_type="text/plain")
        response = api_client.post('/store/products/bulk_upload_zip/', {'file': text_file}, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'must be a .zip archive' in response.data.get('error', '')

    def test_zip_upload_matches_product_and_attaches_images(self, api_client):
        admin_user = User.objects.create_superuser('admin_zip3', 'admin@zip3.com', 'password123')
        api_client.force_authenticate(user=admin_user)

        collection = baker.make(Collection, title="Skincare")
        product = baker.make(
            Product,
            collection=collection,
            title="Nivea Shea Lotion",
            slug="nivea-shea-lotion",
            unit_price=10.0,
            inventory=5,
            is_photos_published=False
        )

        # Create an in-memory ZIP archive with folder: Nivea_Shea_Lotion/photo1.jpg
        zip_buffer = io.BytesIO()
        img_bytes = create_dummy_image_bytes('JPEG')
        with zipfile.ZipFile(zip_buffer, 'w') as zf:
            zf.writestr('Nivea_Shea_Lotion/photo1.jpg', img_bytes)
            zf.writestr('Nivea_Shea_Lotion/photo2.jpg', img_bytes)
        zip_buffer.seek(0)

        uploaded_zip = SimpleUploadedFile("products_media.zip", zip_buffer.getvalue(), content_type="application/zip")
        response = api_client.post('/store/products/bulk_upload_zip/', {'file': uploaded_zip}, format='multipart')

        assert response.status_code == status.HTTP_200_OK
        assert response.data.get('matched_products_count') == 1
        assert response.data.get('total_images_uploaded') == 2

        # Verify images attached and photos published
        product.refresh_from_db()
        assert product.images.count() == 2
        assert product.is_photos_published is True


@pytest.mark.django_db
class TestGoogleSheetSyncSettings:
    """Test saving, retrieving, and clearing Google Sheet sync URLs."""

    def test_settings_requires_admin(self, api_client):
        response = api_client.get('/store/products/get_saved_sheet_url/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_save_and_retrieve_and_delete_sheet_url(self, api_client):
        admin_user = User.objects.create_superuser('admin_sheet', 'admin@sheet.com', 'password123')
        api_client.force_authenticate(user=admin_user)

        # 1. Save sheet URL
        test_url = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?gid=0#gid=0"
        save_resp = api_client.post('/store/products/save_google_sheet_url/', {'url': test_url})
        assert save_resp.status_code == status.HTTP_200_OK
        assert save_resp.data['sheet_url'] == test_url

        # 2. Retrieve sheet URL
        get_resp = api_client.get('/store/products/get_saved_sheet_url/')
        assert get_resp.status_code == status.HTTP_200_OK
        assert get_resp.data['sheet_url'] == test_url

        # 3. Delete sheet URL
        del_resp = api_client.delete('/store/products/delete_saved_sheet_url/')
        assert del_resp.status_code == status.HTTP_200_OK

        # 4. Verify cleared
        get_resp2 = api_client.get('/store/products/get_saved_sheet_url/')
        assert get_resp2.data['sheet_url'] == ''
