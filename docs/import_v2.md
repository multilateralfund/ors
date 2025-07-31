# Import data (V2)


Changes were made to the Projects and BP module that would require new scripts to be run agains the existing data.
The scripts should be run in the following order when installing locally or when first deploying those changes to production.

1. Import project resources:

    python manage.py import_resources_v2 all

2. Import new user permissions and migrate existing users from the user_type to the new user groups:

    python manage.py import_user_permissions all
    python manage.py migrate_user_type_to_groups

3. Upgrades to the existing projects:

    python manage.py import_projects_v2 set-meta-project-for-existing-projects
    python manage.py import_projects_v2 set-new-code-meta-projects
    python manage.py import_projects_v2 migrate-subsectors-sector-data
    python manage.py import_projects_v2 mark_obsolete_values
