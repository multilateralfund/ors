# Import data

## Resources

- To import all resources (groups, substances, blends, blend components, usages, 
    sectors, agencies, countries), run:
```shell
docker-compose exec app ./manage.py import_resources all
```

- To run the import only one resource (e.g. usages), run:
```shell
docker-compose exec app ./manage.py import_resources usages
```

### Command options:
- all_ozone_data -> (import groups, substances, blends and blend_components)
- groups -> import only the groups
- substances -> import only the substances
- blends -> import only the blends
- blend_components -> import only the blend_components
- countries -> import only the countries
- usages -> import only the usages
- adm_columns -> import adm columns
- project-resources -> import agencies, sectors, subsectors,
    project statuses and project types
---

## Records
- To import all records, run (from xlsx and databases):
```shell
docker-compose exec app ./manage.py import_records all
```
- To run the import only for onetype of records(ex. databases), run:
```shell
docker-compose exec app ./manage.py import_records cp_db
```
### Command options:
- xlsx_files -> records from xlsx files
- section_ab -> records from section A and B (xlsx files)
- section_c -> records from section C (xlsx files)
- section_d -> records from section D (xlsx files)
- section_e -> records from section E (xlsx files)
- cp_db_records -> records from country programme databases
- item_attributes -> item_attributes from databases
- admb_items -> admb items from databases
- admc_items -> admc items from databases
- admde_items -> admde items from databases

### Import files

- xlsx_files
: download files from nextclod
    - **nextcloud path** OzoneMlf/Country Programme/data
    - **local path** core/import_data/records

    |nextcloud name | local name |
    | :----    | :----:  |
    | SectionA(ODPTonnes)-Datafor2019-2022(May 10, 2023).xlsx | SectionA.xlsx |
    | SectionB(MetricTonnes)-Datafor2019-2022(May 10, 2023)withGWP.xlsx | SectionB.xlsx |
    | SectionC,D,E-2019-2022(May 10, 2023).xlsx | SectionCDE.xlsx |

- cp_db_records
: download folders from nexcloud
    - **nextcloud path** OzoneMlf/Country Programme/data/json
    - **local path** core/import_data/databases

    |nextcloud name | local name |
    | :----    | :----  |
    | CP | CP |
    | CP2012 | CP2012 |


---

## Project proposals
To import project proposals, run:
```shell
docker-compose exec app ./manage.py import_proposals
```

### Import files

- proposals
: download files from nextclod
    - **nextcloud path** OzoneMlf/Project submissions/data
    - **local path** core/import_data/proposals

    |nextcloud name | local name |
    | :----:    | :----:  |
    | tbProposalsNew90.xlsx | tbProposalsNew90.xlsx |
    | tbProposalsNew91.xlsx | tbProposalsNew91.xlsx |
