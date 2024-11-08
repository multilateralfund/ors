import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import AgencyFactory, UserFactory
from core.models.business_plan import BPFile

pytestmark = pytest.mark.django_db


@pytest.fixture(name="new_agency_user")
def _new_agency_user():
    new_agency = AgencyFactory.create(name="Agency2", code="AG2")
    return UserFactory.create(agency=new_agency, user_type="agency_submitter")


@pytest.fixture(name="test_file")
def _test_file(tmp_path):
    p = tmp_path / "adrian.csv"
    p.write_text("Asa sunt zilele mele")
    return p


@pytest.fixture(name="bp_files_url")
def _bp_files_url(business_plan):
    url = reverse("business-plan-files")
    params = (
        f"?agency_id={business_plan.agency_id}"
        f"&year_start={business_plan.year_start}"
        f"&year_end={business_plan.year_end}"
    )
    return url + params


class TestBPFileUpload:
    client = APIClient()

    def test_file_upload_anon(self, bp_files_url):
        response = self.client.post(bp_files_url, {})
        assert response.status_code == 403

    def test_file_upload_wrong_user(self, bp_files_url, new_agency_user, test_file):
        self.client.force_authenticate(user=new_agency_user)

        # upload file
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 403

    def test_file_upload_wrong_extension(self, user, bp_files_url, test_file):
        self.client.force_authenticate(user=user)

        # upload file with wrong extension
        data = {"adrian.txt": test_file.open()}
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 400

    def test_file_upload(self, user, bp_files_url, test_file, business_plan):
        self.client.force_authenticate(user=user)

        # upload file (POST)
        data = {"adrian.csv": test_file.open()}
        response = self.client.post(bp_files_url, data, format="multipart")
        assert response.status_code == 201

        # check file (GET)
        response = self.client.get(bp_files_url)
        assert response.status_code == 200
        assert response.data[0]["agency_id"] == business_plan.agency_id
        assert response.data[0]["year_start"] == business_plan.year_start
        assert response.data[0]["year_end"] == business_plan.year_end
        assert response.data[0]["filename"] == "adrian.csv"

        # test delete
        file_id = response.data[0]["id"]
        data = {"file_ids": [file_id]}
        response = self.client.delete(bp_files_url, data, format="json")
        assert response.status_code == 204

        # check delete (GET)
        response = self.client.get(bp_files_url)
        assert response.status_code == 200
        assert len(response.data) == 0


@pytest.fixture(name="bp_file_id")
def _bp_file(bp_files_url, user, test_file):
    client = APIClient()
    client.force_authenticate(user=user)

    data = {"adrian.csv": test_file.open()}
    client.post(bp_files_url, data, format="multipart")
    return BPFile.objects.get(filename="adrian.csv").id


class TestBPFileDownload:
    client = APIClient()

    def test_file_download_anon(self, bp_file_id):
        self.client.force_authenticate(user=None)
        url = reverse("business-plan-file-download", kwargs={"id": bp_file_id})
        response = self.client.get(url)
        assert response.status_code == 403

    def test_file_download_wrong_user(self, bp_file_id, new_agency_user):
        self.client.force_authenticate(user=new_agency_user)
        url = reverse("business-plan-file-download", kwargs={"id": bp_file_id})
        response = self.client.get(url)
        assert response.status_code == 403

    def test_file_download(self, agency_user, bp_file_id):
        self.client.force_authenticate(user=agency_user)
        my_file = BPFile.objects.get(id=bp_file_id).file
        # download file
        url = reverse("business-plan-file-download", kwargs={"id": bp_file_id})
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.content == my_file.read()
