# Import data (V2)


Changes were made to the Projects and BP module that would require new scripts to be run agains the existing data.
The scripts should be run in the following order when installing locally or when first deploying those changes to production.

1. Import project resources:
```
    python manage.py import_resources_v2 all
```
2. Import new user permissions and migrate existing users from the user_type to the new user groups:
```
    python manage.py import_user_permissions all
    python manage.py migrate_user_type_to_groups
```
3. Upgrades to the existing projects:
```
    python manage.py import_projects_v2 populate_existing_projects_metacode
    python manage.py import_projects_v2 populate_existing_projects_lead_agency
    python manage.py import_projects_v2 populate_existing_projects_category
    python manage.py import_projects_v2 populate_existing_projects_production
    python manage.py import_projects_v2 populate_existing_meta_projects_fields

    ONLY AFTER EXTRACTING ALL INFORMATION FROM META-PROJECTS:
    python manage.py import_projects_v2 remove-all-meta-project-associations

    python manage.py import_projects_v2 migrate-subsectors-sector-data
    python manage.py import_projects_v2 mark_obsolete_values
```

4. Importing resources
```
    python manage.py import_resources_v2 import_project_type
    python manage.py import_resources_v2 import_sector
    python manage.py import_resources_v2 import_subsector
    python manage.py import_resources_v2 import modules
    python manage.py import_resources_v2 import_alternative_technologies

    python manage.py import_resources_v2 import_project_submission_statuses
    python manage.py import_resources_v2 clean_up_project_statuses
    python manage.py import_resources_v2 clean_up_project_submission_statuses

    python manage.py import_resources_v2 clean_up_project_meta_project_attributes


    python manage.py import_resources_v2 import_fields
    python manage.py import_resources_v2 import_cluster_type_sector_links
    python manage.py import_resources_v2 import_project_specific_fields

    python manage.py import_resources_v2 fill_replacement_technologies_field

You can update the `ClusterTypeSectorLinks.json` using an updated `project_specific_fields.xlsx` file and
the `generate_new_cluster_type_sector_file` function from `import_project_resources_v2.py`



## Migrating 2026 projects data:


For migrating the 2026 projects data, please first download files from nextcloud
    - **nextcloud path** OzoneMlf/5. Projects - database/2026 Data/2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx
    - **local path** core/import_data_v2/projects/migrations_2026/

After that, run the following commands:

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
