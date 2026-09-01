import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.catalog.models import Collection
from model_bakery import baker

User = get_user_model()

@pytest.fixture
def create_collection(api_client):
    def do_create_collection(collection_data):
        return api_client.post('/store/collections/', collection_data)
    return do_create_collection


@pytest.mark.django_db
class TestCatalogDomain:
    def test_if_user_is_anonymous_return_401(self, api_client, create_collection):
        response = create_collection({'title': 'New Collection'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_if_user_is_not_admin_return_403(self, api_client, create_collection, authenticate):
        authenticate(is_staff=False)
        response = create_collection({'title': 'New Collection'})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_if_data_is_valid_returns_201(self, api_client, create_collection, authenticate):
        authenticate(is_staff=True)
        response = create_collection({'title': 'Summer Collection'})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['id'] > 0

    def test_if_collection_exist_return_200(self, api_client):
        collection = baker.make(Collection)
        response = api_client.get(f'/store/collections/{collection.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == collection.id
