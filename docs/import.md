### Import data
To import resources (groups, substances, blends, blend components, usages, 
    sectors, agencies, countries), run:
```shell
docker-compose exec app ./manage.py import_resources all
```

To run the import only for one resource(ex. usages) run:
```shell
docker-compose exec app ./manage.py import_resources usages
```
The options for this command are:
- all_ozone_data -> (import groups, substances, blends and blend_components)
- groups -> import only the groups
- substances -> -> import only the substances
- blends -> -> import only the blends
- blend_components -> -> import only the blend_components
- countries -> -> import only the countries
- usages -> -> import only the usages
- sectors -> -> import the sectors and subsectors
- agencies -> -> import only the agencies

To import all records run (from xlsx and databases):
```shell
docker-compose exec app ./manage.py import_records all
```

To run the import only for onetype of records(ex. databases) run:
```shell
docker-compose exec app ./manage.py import_records cp_db
```
The options for this command are:
- xlsx_files -> records from xlsx files
- cp_db -> country programme databases

To import project proposals run:
```shell
docker-compose exec app ./manage.py import_proposals
```