from rest_framework.test import APIClient


# pylint: disable=C8008,W0221
class BaseTest:
    client = APIClient()
    url = None

    def test_without_login(self, **kwargs):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url)
        assert response.status_code == 403
