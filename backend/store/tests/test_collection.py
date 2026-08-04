import pytest
from rest_framework import status
from django.contrib.auth.models import User
from store.models import Collection
from model_bakery import baker

@pytest.fixture
def create_collection(api_client):
    def do_create_collection(collection_data):
        return api_client.post('/store/collections/', collection_data)
    return do_create_collection



@pytest.mark.django_db
class TestCreateCollection:
    def test_if_user_is_anonymous_return_401(self, api_client,create_collection):
        response = create_collection({'title': 'a'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_if_user_is_not_admin_return_403(self, api_client,create_collection,authenticate):
        authenticate()

        response = create_collection({'title': 'a'})

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_if_data_is_invalid_returns_400(self, api_client,create_collection,authenticate):
        authenticate(is_staff = True)
        response = create_collection({'title': ''})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['title'] is not None

    def test_if_data_is_valid_returns_201(self, api_client,create_collection):
        api_client.force_authenticate(user=User(is_staff = True))
        response = create_collection({'title': 'a'})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['id'] > 0

@pytest.mark.django_db
class TestRetriveCollcetion:

    def test_if_collection_exist_return_200(self, api_client):
        collection = baker.make(Collection)
        response = api_client.get(f'/store/collections/{collection.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == {
            'id': collection.id,
            'title': collection.title,
            'featured_product': None,
            'products': [],
            'image': None
        }