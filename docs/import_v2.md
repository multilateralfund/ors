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
    python manage.py import projects_v2 populate_existing_projects_production
    python manage.py import projects_v2 populate_existing_meta_projects_umbrella_code

    ONLY AFTER EXTRACTING ALL INFORMATION FROM META-PROJECTS:
    python manage.py import projects_v2 remove-all-meta-project-associations

    python manage.py import_projects_v2 migrate-subsectors-sector-data
    python manage.py import_projects_v2 mark_obsolete_values
```


You can update the `ClusterTypeSectorLinks.json` using an updated `project_specific_fields.xlsx` file and
the `generate_new_cluster_type_sector_file` function from `import_project_resources_v2.py`