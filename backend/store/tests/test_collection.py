from rest_framework import APIClient
from rest_framework import status


class TestCreateCollection:
    def test_if_user_is_anonymous_return_401(self):
        response = client.post('/store/collections/', {'title': 'a'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    