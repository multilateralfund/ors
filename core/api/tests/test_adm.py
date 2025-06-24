from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    AdmChoiceFactory,
    AdmColumnFactory,
    AdmRowFactory,
    CPReportFactory,
)
import pytest
from django.urls import reverse


pytestmark = pytest.mark.django_db
# pylint: disable=C8008


@pytest.fixture(name="_setup_empty_form")
def setup_empty_form(country_ro, cp_report_2005, time_frames):
    cp_report_17 = CPReportFactory.create(
        country=country_ro, year=2017, comment="Daca ploua nu ma ploua"
    )
    used_time_frames = [
        time_frames[(2000, 2011)],
        time_frames[(2019, None)],
    ]

    for section in ["B", "C"]:
        for time_frame in used_time_frames:
            # create adm column
            for i in range(2):
                order = 2 - i
                last_col = AdmColumnFactory.create(
                    display_name=f"adm_column_{order}",
                    sort_order=order,
                    section=section,
                    time_frame=time_frame,
                    parent=None,
                )
            AdmColumnFactory.create(
                display_name="adm_column_child_1",
                sort_order=5,
                section=section,
                time_frame=time_frame,
                parent=last_col,
            )

            # create adm rows
            row_data = {
                "section": section,
                "time_frame": time_frame,
            }
            title = AdmRowFactory.create(
                text=f"title_{section}",
                sort_order=2,
                type="title",
                parent=None,
                **row_data,
            )
            subtitle = AdmRowFactory.create(
                text=f"subtitle_{section}",
                sort_order=4,
                type="subtitle",
                parent=title,
                **row_data,
            )

            row_data["type"] = "question"
            row_data["parent"] = subtitle
            for i in range(2):
                order = 4 + i
                AdmRowFactory.create(
                    text=f"{subtitle.text}_row_{i}",
                    sort_order=order,
                    **row_data,
                )
            if section == "B":
                # add 1.6.1 rows
                for cp_report in [cp_report_2005, cp_report_17]:
                    AdmRowFactory.create(
                        text=f"{subtitle.text}_row_161_{cp_report.year}",
                        sort_order=10,
                        index="1.6.1",
                        country_programme_report=cp_report,
                        **row_data,
                    )
                for index in ["1.6.1", "1.6.2"]:
                    AdmRowFactory.create(
                        text="N/A",
                        sort_order=12,
                        index=index,
                        **row_data,
                    )

    for time_frame in used_time_frames:
        for i in range(2):
            d_row = AdmRowFactory.create(
                text=f"d_row_{i}",
                sort_order=1,
                section="D",
                type="question",
                time_frame=time_frame,
            )
            # add 3 choices for each row
            for j in range(3):
                AdmChoiceFactory.create(
                    adm_row=d_row,
                    value=f"d_row_choice_{i}{j}",
                    sort_order=j,
                )

    return cp_report_17


class TestAdmEmptyFormView(BaseTest):
    url = reverse("empty-form")

    def test_get_empty_form_annon(self, cp_report_2005):
        # test without authentication
        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 403

    def test_get_empty_form_2005(
        self, secretariat_user, cp_report_2005, _setup_empty_form, _cp_report_format
    ):
        self.client.force_authenticate(user=secretariat_user)

        # get adm form for 2005 cp report
        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 200

        # check usage Columns
        assert len(response.data["usage_columns"]["section_a"]) == 2
        section_a_usages = response.data["usage_columns"]["section_a"]
        assert len(section_a_usages[0]["children"]) == 1
        assert len(section_a_usages[0]["children"][0]["children"]) == 1
        assert "section_b" not in response.data["usage_columns"]

        # check adm_b section
        assert len(response.data["adm_b"]["columns"]) == 2
        assert len(response.data["adm_b"]["columns"][0]["children"]) == 1
        assert len(response.data["adm_b"]["rows"]) == 6
        # check rows sort order
        admb_rows = response.data["adm_b"]["rows"]
        assert admb_rows[0]["text"] == "title_B"
        assert admb_rows[1]["text"] == "subtitle_B"
        assert admb_rows[2]["text"] == "subtitle_B_row_0"
        assert admb_rows[3]["text"] == "subtitle_B_row_1"
        assert admb_rows[4]["text"] == "subtitle_B_row_161_2005"
        assert admb_rows[5]["text"] == "N/A"
        assert admb_rows[5]["index"] == "1.6.2"

        # check adm_c section
        assert len(response.data["adm_c"]["columns"]) == 2
        assert len(response.data["adm_c"]["rows"]) == 4

        # check adm_d section
        assert len(response.data["adm_d"]["rows"]) == 2
        assert len(response.data["adm_d"]["rows"][0]["choices"]) == 3
        assert len(response.data["adm_d"]["rows"][1]["choices"]) == 3

    def test_get_empty_form_2017(
        self, secretariat_user, _setup_empty_form, _cp_report_format
    ):
        self.client.force_authenticate(user=secretariat_user)
        cp_report_17 = _setup_empty_form

        response = self.client.get(self.url, {"cp_report_id": cp_report_17.id})
        assert response.status_code == 200

        # check usage Columns
        assert len(response.data["usage_columns"]["section_a"]) == 1
        assert len(response.data["usage_columns"]["section_b"]) == 1
        section_b_usages = response.data["usage_columns"]["section_b"]
        assert len(section_b_usages[0]["children"]) == 2
        assert len(section_b_usages[0]["children"][0]["children"]) == 1

        assert len(response.data["adm_b"]["columns"]) == 0
        assert len(response.data["adm_b"]["rows"]) == 0
        assert len(response.data["adm_c"]["columns"]) == 0
        assert len(response.data["adm_c"]["rows"]) == 0
        assert len(response.data["adm_d"]["rows"]) == 0
