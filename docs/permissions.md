# Permissions

| Endpoint                                      | Method  | Permissions                        | Comments |
| --------------------------------------------- | --------| ---------------------------------- | ---------|
| replenishment/countries                       |  GET    |      -                             | Returned entries restricted for `can_view_only_own_country`|
| replenishment/countries-soa                   |  GET    |      -                             |          |
| replenishment/as-of-date                      |  GET    | has_replenishment_view_access      |          |
| replenishment/budget-years                    |  GET    | has_replenishment_view_access      |          |
| replenishment/replenishments                  |  GET    | has_replenishment_view_access      |          |
| replenishment/replenishments                  |  POST   | has_replenishment_edit_access      |          |
| replenishment/disputed-contributions          |  POST   | has_replenishment_edit_access      | Entries filtered for `can_view_only_own_country` |
| replenishment/disputed-contributions          |  DELETE | has_replenishment_edit_access      | Entries filtered for `can_view_only_own_country` |
| replenishment/bilateral-assistance            |  POST   | has_replenishment_edit_access      |          |
| replenishment/bilateral-assistance            |  GET    | has_replenishment_view_access      | Entries filtered for `can_view_only_own_country` |
| replenishment/bilateral-assistance/{id}       |  GET    | has_replenishment_view_access      | Entries filtered for `can_view_only_own_country` |
| replenishment/scales-of-assessment            |  GET    | has_replenishment_view_access      |  |
| replenishment/scales-of-assessment            |  POST   | has_replenishment_edit_access      |  |
| replenishment/scales-of-assessment/export     |  GET    | has_replenishment_view_access      |  |
| /replenishment/external-allocations/          |  GET    | has_replenishment_view_access      |  |
| /replenishment/external-allocations/          |  POST   | has_replenishment_edit_access      |  |
| /replenishment/external-allocations/{id}      |  GET    | has_replenishment_view_access      |  |
| /replenishment/external-allocations/{id}      |  PUT    | has_replenishment_edit_access      |  |
| /replenishment/external-allocations/{id}      |  PATCH  | has_replenishment_edit_access      |  |
| /replenishment/external-allocations/{id}      |  DELETE | has_replenishment_edit_access      |  |
| /replenishment/external-income/               |  GET    | has_replenishment_view_access      |  |
| /replenishment/external-income/               |  POST   | has_replenishment_edit_access      |  |
| /replenishment/external-income/{id}/          |  GET    | has_replenishment_view_access      |  |
| /replenishment/external-income/{id}/          |  PUT    | has_replenishment_edit_access      |  |
| /replenishment/external-income/{id}/          |  PATCH  | has_replenishment_edit_access      |  |
| /replenishment/external-income/{id}/          |  DELETE | has_replenishment_edit_access      |  |
| /replenishment/invoices/                      |  GET    | has_replenishment_view_access      | Entries filtered for `can_view_only_own_country` |
| /replenishment/invoices/                      |  POST   | has_replenishment_edit_access      |  |
| /replenishment/invoices/{id}/                 |  GET    | has_replenishment_view_access      | Entries filtered for `can_view_only_own_country` |
| /replenishment/invoices/{id}/                 |  PUT    | has_replenishment_edit_access      |  |
| /replenishment/invoices/{id}/                 |  PATCH  | has_replenishment_edit_access      |  |
| /replenishment/invoices/{id}/                 |  DELETE | has_replenishment_edit_access      |  |
| replenishment/payments/                       |  GET    | has_replenishment_view_access      | Entries filtered for `can_view_only_own_country` |
| replenishment/payments/                       |  POST   | has_replenishment_edit_access      |  |
| replenishment/payments/{id}/                  |  GET    | has_replenishment_view_access      | Entries filtered for `can_view_only_own_country` |
| replenishment/payments/{id}/                  |  PUT    | has_replenishment_edit_access      |  |
| replenishment/payments/{id}/                  |  PATCH  | has_replenishment_edit_access      |  |
| replenishment/payments/{id}/                  |  DELETE | has_replenishment_edit_access      |  |
| replenishment/status-files/                   |  GET    | has_replenishment_view_access      |  |
| replenishment/status-files/                   |  POST   | has_replenishment_edit_access      |  |
| replenishment/status-files/{id}/              |  GET    | has_replenishment_view_access      |  |
| replenishment/status-files/{id}/              |  DELETE | has_replenishment_edit_access      |  |
| country-programme/reports/                    |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country` |
| country-programme/reports/                    |  POST   | has_cp_report_edit_access          | Entries filtered for `can_view_only_own_country`. Need `can_submit_final_cp_version` for POST with Final status |
| country-programme/reports/                    |  PUT    | has_cp_report_edit_access          | Need `can_submit_final_cp_version` for PUT with Final status |
| country-programme/reports/                    |  PATCH  | has_cp_report_edit_access          | Need `can_submit_final_cp_version` for PUT with Final status |
| country-programme/reports/                    |  DELETE | has_cp_report_delete_access        |  |
| country-programme/reports/{id}/               |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country` |
| country-programme/reports/{id}/               |  POST   | has_cp_report_edit_access          | Entries filtered for `can_view_only_own_country`. Need `can_submit_final_cp_version` for POST with Final status |
| country-programme/reports/{id}/               |  PUT    | has_cp_report_edit_access          | Need `can_submit_final_cp_version` for PUT with Final status |
| country-programme/reports/{id}/               |  PATCH  | has_cp_report_edit_access          | Need `can_submit_final_cp_version` for PUT with Final status |
| country-programme/reports/{id}/               |  DELETE | has_cp_report_delete_access        |  |
| country-programme/report/{id}/status-update/  |  PUT    | has_cp_report_edit_access          | Entries filtered for `can_view_only_own_country`. Need `can_submit_final_cp_version` for POST with Final status |
| country-programme/report/{id}/comments/       |  POST   | has_cp_report_edit_access          | Need `can_cp_country_type_comment` for country type comment/`can_cp_secretariat_type_comment` for secretariat comment |
| country-programme/report/{id}/comments/       |  PUT    | has_cp_report_edit_access          | Need `can_cp_country_type_comment` for country type comment/`can_cp_secretariat_type_comment` for secretariat comment |
| country-programme/reports-by-year             |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country` |
| country-programme/reports-by-country          |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country` |
| country-programme/records/                    |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country` |
| country-programme/records/diff/               |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country` |
| country-programme/export/                     |  GET    | has_cp_report_view_access          | TODO: Check where this ENDPOINT is used. |
| country-programme/reports/export/             |  GET    | has_cp_report_export_access        | |
| country-programme/hfc/export/                 |  GET    | has_cp_report_export_access        | |
| country-programme/hcfc/export/                |  GET    | has_cp_report_export_access        | |
| country-programme/data-extraction-all/export/ |  GET    | has_cp_report_export_access        | |
| country-programme/calculated-amount/export/   |  GET    | has_cp_report_export_access        | |
| country-programme/calculated-amount/print/    |  GET    | has_cp_report_export_access        | |
| country-programme/export-empty/               |  GET    | has_cp_report_export_access        | |
| country-programme/print/                      |  GET    | has_cp_report_export_access        | |
| country-programme/empty-form/                 |  GET    | has_cp_report_export_access        | Entries filtered for `can_view_only_own_country`. | 
| country-programme/versions/                   |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country`. |
| country-programme/files/                      |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country`. |
| country-programme/files/                      |  POST   | has_cp_report_edit_access          | Country checked  for `can_view_only_own_country`. |
| country-programme/files/                      |  DELETE | has_cp_report_edit_access          | Country checked  for `can_view_only_own_country`. |
| country-programme/files/{id}/download/        |  GET    | has_cp_report_view_access          | |
| country-programme-archive/records/            |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country`. |
| country-programme-archive/export/             |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country`. |
| country-programme-archive/print/              |  GET    | has_cp_report_view_access          | Entries filtered for `can_view_only_own_country`. |
| countries/                                    |  GET    | -                                  | Entries filtered for `can_view_only_own_country`. |
| meta-projects/                                |  GET    | has_meta_projects_view_access      | |
| project-statuses/                             |  GET    | has_project_metainfo_view_access   | |
| project-submission-statuses/                  |  GET    | has_project_metainfo_view_access   | |
| project-types/                                |  GET    | has_project_metainfo_view_access   | |
| projects-statistics/                          |  GET    | has_project_statistics_view_access | Entries filtered for `can_view_only_own_country`. Entries filtered for `can_view_only_own_agency`.|
| project-clusters/                             |  GET    | has_project_metainfo_view_access   | |
| project-cluster/{cluster_id}/type/{type_id}/sector/{sector_id}/fields/ |  GET    | has_project_metainfo_view_access   | |
| project-files/{id}/                           |  GET    |                                    | |
| project-files/{id}/                           |  DELETE |                                    | |
| project/{project_id}/files/v2/                |  GET    | has_project_v2_view_access         | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. `editable` field added for each file to point if the user can or cannot delete the file |
| project/{project_id}/files/v2/                |  POST   | has_project_v2_edit_access         | Entries filtered for `can_view_only_own_agency`and `can_view_production_projects`. Further filtering using `has_project_v2_draft_edit_access`, `has_project_v2_version1_version2_edit_access` and `has_project_v2_version3_edit_access` (matches editable from GET)
| project/{project_id}/files/v2/                |  DELETE | has_project_v2_edit_access         |  Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. Further filtering using `has_project_v2_draft_edit_access`, `has_project_v2_version1_version2_edit_access` and `has_project_v2_version3_edit_access` (matches editable from GET)
| project/<int:project_id>/files/<int:id>/download/v2/ |  GET | has_project_v2_view_access     |  Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. |
| project/files/validate/                       |  POST   | has_project_v2_edit_access         | 
| business-plan/upload/validate/                |  POST   | has_business_plan_edit_access      | 
| business-plan/upload/                         |  POST   | has_business_plan_edit_access      | 
| business-plan/bp-chemical-types/              |  GET    | has_business_plan_view_access      | 
| business-plan-activity/export/                |  GET    | has_business_plan_view_access      | 
| business-plan/files/                          |  GET    | has_business_plan_view_access      | 
| business-plan/files/                          |  POST   | has_business_plan_edit_access      | 
| business-plan/files/                          |  DELETE | has_business_plan_edit_access      | 
| business-plan/files/{id}/download/            |  GET    | has_business_plan_view_access      | 
| replenishment/dashboard/                      |  GET    | has_replenishment_view_access      | 
| replenishment/dashboard/export/               |  GET    | has_replenishment_view_access      | 
| replenishment/status-of-contributions/statistics/ |  GET    | has_replenishment_view_access  | 
| replenishment/status-of-contributions/statistics-export/ |  GET    | has_replenishment_view_access  | 
| replenishment/status-of-contributions/summary/export/ |  GET    | has_replenishment_view_access  | 
| replenishment/status-of-contributions/summary/ |  GET    | has_replenishment_view_access  | 
| replenishment/status-of-contributions/{start_year}/{end_year}/export/ |  GET    | has_replenishment_view_access  | 
| replenishment/status-of-contributions/export/ |  GET    | has_replenishment_view_access  | 
| replenishment/status-of-contributions/{start_year}/{end_year}/ |  GET    | has_replenishment_view_access  | 
| replenishment/status-of-contributions/{year}/export/ |  GET    | has_replenishment_view_access  | 
| replenishment/statistics/export/              |  GET    | has_replenishment_view_access  | 
| replenishment/status-of-contributions/{year}/ |  GET    | has_replenishment_view_access  | 
| replenishment/invoice-file/{id}/download/     |  GET    | has_replenishment_view_access  | Entries filtered for `can_view_only_own_country`. |
| replenishment/payment-file/{id}/download/     |  GET    | has_replenishment_view_access  | Entries filtered for `can_view_only_own_country`. |
| replenishment/scale-of-assessment-version/{id}/file/download/ |  GET    | has_replenishment_view_access  | 
| replenishment/input-data/export/              |  GET    | has_replenishment_view_access  | 
| projects/v2/                                  |  GET    | has_project_v2_view_access     | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. `editable` field added for each project to point if the user can or cannot edit/submit the project|
| projects/v2/                                  |  POST   | has_project_v2_edit_access     | 
| projects/v2/associate_projects/               |  POST   | has_project_v2_associate_projects_access | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. * `can_view_only_own_agency` will most likely not apply as users with `has_project_v2_associate_projects_access` have access to all agencies.*
| projects/v2/export/                           |  GET    | has_project_v2_view_access     | 
| projects/v2/{id}/                             |  GET    | has_project_v2_view_access     |  Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. `editable` field added for the project to point if the user can or cannot edit/submit the project|
| projects/v2/{id}/                             |  PUT    | has_project_v2_edit_access     |  Entries filtered for 'can_view_only_own_agency' and `can_view_production_projects`.  Further filtering using `has_project_v2_draft_edit_access`, `has_project_v2_version1_version2_edit_access` and `has_project_v2_version3_edit_access` (matches editable from GET)
| projects/v2/{id}/edit_actual_fields/          |  PUT    | has_project_v2_edit_access     |  Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. Only allowed for projects with submission status = `Appproved`
| projects/v2/{id}/                             |  PATCH  | has_project_v2_edit_access     | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`.  Further filtering using `has_project_v2_draft_edit_access`, `has_project_v2_version1_version2_edit_access` and `has_project_v2_version3_edit_access` (matches editable from GET)
| projects/v2/{id}/list_previous_tranches/      |  GET    | has_project_v2_view_access     | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. *only given project is filtered, all tranches are returned*
| projects/v2/{id}/list_associated_projects/    |  GET    | has_project_v2_view_access     | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. *only given project is filtred, all associated projects are not.
| projects/v2/{id}/recommend/                   |  POST   | has_project_v2_recommend_projects_access | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`.
| projects/v2/{id}/send_back_to_draft/          |  POST   | has_project_v2_recommend_projects_access |  Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`.
| projects/v2/{id}/submit/                      |  POST   | has_project_v2_submit_access   | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`.  Further filtering using `has_project_v2_draft_edit_access`, `has_project_v2_version1_version2_edit_access` and `has_project_v2_version3_edit_access` (matches editable from GET). ! Just the given project is filtered, associated/previous tranches don't have permissions over them.
| projects/v2/{id}/withdraw/                    |  POST   | has_project_v2_recommend_projects_access |  Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`.
| projects/                                     |  GET    | has_project_view_access                  | Entries filtered for `can_view_only_own_agency`. Entries filtered for `can_view_only_own_country` |
| projects/                                     |  POST   | has_project_edit_access                  | Entries filtered for `can_view_only_own_agency`. |
| projects/export/                              |  GET    | has_project_view_access                  | |
| projects/print/                               |  GET    | has_project_view_access                  | |
| projects/{id}/                                |  GET    | has_project_view_access                  | Entries filtered for `can_view_only_own_agency`. Entries filtered for `can_view_only_own_country` |
| projects/{id}/                                |  PUT    | has_project_edit_access                  | Entries filtered for `can_view_only_own_agency`. |
| projects/{id}/                                |  PATCH  | has_project_edit_access                  | Entries filtered for `can_view_only_own_agency`. |
| projects/{id}/upload/                         |  POST   | has_project_edit_access                  | |
| project-association/                          |  GET    | has_project_v2_view_access               | Entries filtered for `can_view_only_own_agency` and `can_view_production_projects`. |
| project-fund/                                 |  POST   | has_project_edit_access                  | |
| project-fund/                                 |  PUT    | has_project_edit_access                  | |
| project-fund/                                 |  PATCH  | has_project_edit_access                  | |
| project-fund/                                 |  DELETE | has_project_edit_access                  | |
| project-ods-odp/                              |  POST   | has_project_edit_access                  | |
| project-ods-odp/                              |  PUT    | has_project_edit_access                  | |
| project-ods-odp/                              |  PATCH  | has_project_edit_access                  | |
| project-ods-odp/                              |  DELETE | has_project_edit_access                  | |
| project-comment/                              |  POST   | has_project_edit_access                  | |
| project-comment/                              |  PUT    | has_project_edit_access                  | |
| project-comment/                              |  PATCH  | has_project_edit_access                  | |
| project-comment/                              |  DELETE | has_project_edit_access                  | |
| project-rbm-measure/                          |  POST   | has_project_edit_access                  | |
| project-rbm-measure/                          |  PUT    | has_project_edit_access                  | |
| project-rbm-measure/                          |  PATCH  | has_project_edit_access                  | |
| project-rbm-measure/                          |  DELETE | has_project_edit_access                  | |
| project-sector                                |  GET    | has_sectors_and_subsectors_view_acces    | |
| project-sector                                |  POST   | has_sectors_and_subsectors_edit_access   | |
| project-subsector                             |  GET    | has_sectors_and_subsectors_view_acces    | |
| project-subsector                             |  POST   | has_sectors_and_subsectors_edit_access   | |
| submission-amount/                            |  POST   | has_project_edit_access                  | |
| submission-amount/                            |  PUT    | has_project_edit_access                  | |
| submission-amount/                            |  PATCH  | has_project_edit_access                  | |
| submission-amount/                            |  DELETE | has_project_edit_access                  | |
| business-plan/                                |  GET    | has_business_plan_view_access            | |
| business-plan/                                |  POST   | has_business_plan_edit_access            | |
| business-plan/get-years/                      |  GET    | has_business_plan_view_access            | |
| business-plan/get/                            |  GET    | has_business_plan_view_access            | |
| business-plan/{id}/                           |  GET    | has_business_plan_view_access            | |
| business-plan/{id}/                           |  PUT    | has_business_plan_edit_access            | |
| business-plan/{id}/                           |  PATCH  | has_business_plan_edit_access            | |
| business-plan-activity/                       |  GET    | has_business_plan_view_access            | |
| business-plan-activity/{id}/                  |  GET    | has_business_plan_view_access            | |
| business-plan-activity/{id}/validate_for_removal/ |  GET | has_business_plan_view_access           | |
