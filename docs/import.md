### Import data
To import resources (groups, substances, blends, blend components, usages, 
    sectors, agencies, countries), run:
```shell
docker-compose exec app ./manage.py import_resources
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

To import records run:
```shell
docker-compose exec app ./manage.py import_records
```

To import project proposals run:
```shell
docker-compose exec app ./manage.py import_proposals
```