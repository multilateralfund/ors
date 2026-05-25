# Import data (V2)

If you are running on a new installation, without any data, please run the following scripts:

! Warning. Some information might still be missing as this data was imported overtime, with manual additions too.

All commands should be run in the app container:
```shell
    docker exec -it mlf.app bash
```


1. Firstly, you will need to import all resources initially defined in the application, that are already
expected to exist by import_resources_v2:

For running this script, the following files will be required:

### Import files
- project-resources
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Projects inventory/data/json
    - **local path** .fs/import_files/project_database

You will need at least the following files for importing:
* tbSector.json ---> /app/.fs/import_files/project_database/tbSector.json
* tbSubsector.json ---> /app/.fs/import_files/project_database/tbSubsector.json
* tbStatusOfProjects.json ---> /app/.fs/import_files/project_database/tbStatusOfProjects.json
* tbTypeOfProject.json ---> /app/.fs/import_files/project_database/tbTypeOfProject.json

- To import all resources (groups, substances, blends, blend components, usages,
    sectors, agencies, countries), run:

```shell
    python ./manage.py import_resources all
```

2. Syncronize meetings and decisions. Those should be taken automatically over-night by celery, but please run
the following to ensure the Meetings and Decisions are populated before you run the following scripts:
```shell
   python manage.py shell
   >>>from core.tasks import synchronize_meetings, synchronize_decisions
   >>>synchronize_meetings()
   >>>synchronize_decisions()
```
   Please mind that a full sync from of **synchronize_decisions** takes a few minutes to complete


3. Importing resources v2 (as they were modified for implementation of the Projects Submission module):

```shell
    python manage.py import_resources_v2 import_project_clusters
    python manage.py import_resources_v2 import_project_type
    python manage.py import_resources_v2 import_sector
    python manage.py import_resources_v2 import_subsector
    python manage.py import_resources_v2 import_modules
    python manage.py import_resources_v2 import_alternative_technologies
    python manage.py import_resources_v2 import_project_submission_statuses
    python manage.py import_resources_v2 import_fields
    python manage.py import_resources_v2 import_cluster_type_sector_links
    python manage.py import_resources_v2 import_project_specific_fields
    python manage.py import_resources_v2 fill_replacement_technologies_field
```

You can update the `ClusterTypeSectorLinks.json` using an updated `project_specific_fields.xlsx` file and
the `generate_new_cluster_type_sector_file` function from `import_project_resources_v2.py`


4. (Optional, only if you have existing data) Clean-up existing project data

```shell
    python manage.py import_resources_v2 clean_up_project_statuses
    python manage.py import_resources_v2 clean_up_project_submission_statuses
    python manage.py import_resources_v2 clean_up_project_meta_project_attributes
    python manage.py import_projects_v2 populate_existing_projects_metacode
    python manage.py import_projects_v2 populate_existing_projects_lead_agency
    python manage.py import_projects_v2 populate_existing_projects_category
    python manage.py import_projects_v2 populate_existing_projects_production
    python manage.py import_projects_v2 populate_existing_meta_projects_fields

    Use the following command ONLY if you intend to remove all associations between projects and meta-projects:
    python manage.py import_projects_v2 remove-all-meta-project-associations

    Use to fill meta projects for existing in submission projects before the change (should only be required locally/on staging):
    python manage.py import_resources_v2 fill_meta_project_for_projects_in_submission
```

5. Clean-up existing project data (should run for clean install too, as those scripts also perform some clean-up on the resources):

```shell
    python manage.py import_projects_v2 migrate-subsectors-sector-data
    python manage.py import_projects_v2 mark_obsolete_values
```

5. Migrating 2026 projects data:

For migrating the 2026 projects data, please first download files from nextcloud
    - **nextcloud path** OzoneMlf/5. Projects - database/2026 Data/2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx
    - **local path** core/import_data_v2/projects/migrations_2026/

After that, run the following commands:

```shell
    python manage.py migrate_projects_2026 create_missing_clusters_types_sectors_subsectors
    python manage.py migrate_projects_2026 current_inventory
    python manage.py migrate_projects_2026 set_new_code
    python manage.py migrate_projects_2026 ods_phaseout_fields
    python manage.py migrate_projects_2026 ods_production_fields
    python manage.py migrate_projects_2026 funding_fields
    python manage.py migrate_projects_2026 transfer_fields
    python manage.py migrate_projects_2026 c_and_p
    python manage.py migrate_projects_2026 fill_total_phase_out_values_in_project
    python manage.py migrate_projects_2026 fill_project_end_date_mya_with_date_per_agreement
```

6. Importing enterprises:

For migrating enterprises, please first download files from nextcloud
    - **nextcloud path** OzoneMlf/5. Projects - database/2026 Data/Enterprises_DB_and_Templates_Combined_final_Dec_2025.xlsx
    - **local path** core/import_data_v2/resources/enterprises/Enterprises_DB_and_Templates_Combined_final_Dec_2025.xlsx

After that, run the following command:

```shell
    python manage.py import_enterprises
```
