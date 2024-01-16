# Import data

## All data

To import all data with a single command use:

```shell
docker-compose exec app ./manage.py import_all
```

The files required for the imports are described in the next sections below.

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
- time_frames -> import time frames
- usages -> import only the usages
- adm_columns -> import adm columns
- excluded_usages -> import excluded usages
- project_resources -> import agencies, sectors, subsectors,
    project statuses and project types
---

### Import files
- project-resources
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Projects inventory/data/json
    - **local path** .fs/import_files/project_database


## Records
- To import all records, run (from xlsx and databases):
```shell
docker-compose exec app ./manage.py import_records all
```
- To run the import only for one type of records(ex. databases), run:
```shell
docker-compose exec app ./manage.py import_records cp_db
```
### Command options:
- xlsx_files -> records from xlsx files
- records_95_04 -> records from 1995 to 2004 (xlsx file)
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
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Data/1. Country Programme/data
    - **local path** .fs/import_files/records

    |nextcloud name | local name |
    | :----    | :----:  |
    | SectionA(ODPTonnes)-Datafor2019-2022(May 10, 2023).xlsx | SectionA.xlsx |
    | SectionB(MetricTonnes)-Datafor2019-2022(May 10, 2023)withGWP.xlsx | SectionB.xlsx |
    | SectionC,D,E-2019-2022(May 10, 2023).xlsx | SectionCDE.xlsx |
    | 1995-2004 CP Data Submitted[38].xlsx | CPDataSubmitted_94_04.xlsx |


- cp_db_records
: download folders from nexcloud
    - **nextcloud path** OzoneMlf/Data/1. Country Programme/data/json
    - **local path** .fs/import_files/databases

    |nextcloud name | local name |
    | :----    | :----  |
    | CP | CP |
    | CP2012 | CP2012 |


---

## Projects 
To import project and project proposals:
```shell
docker-compose exec app ./manage.py import_projects all
```
To run the import only for one type (ex. proposals), run:
```shell
docker-compose exec app ./manage.py import_projects proposals
```
### Command options:
- proposals -> project proposals xlsx files
- projects -> projects from tbInventory
- multi_year_projects -> multi year projects from MultiYear-Projects
- progress -> progress reports from tbProgress 
- comments -> project comments
- meta_projects -> project meta projects
- all_pcr -> all data for project complition reports (activities, delay_explanation, learned_lessons)
- pcr_activities -> project complition report activities
- pcr_delay_explanation -> project complition report delay explanation
- pcr_learned_lessons -> project complition report learned lessons
- all -> all of the above
            
### Import files

- proposals
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Data/2.1 Project submissions/data
    - **local path** .fs/import_files/proposals

    |nextcloud name | local name |
    | :----:    | :----:  |
    | tbProposalsNew90.xlsx | tbProposalsNew90.xlsx |
    | tbProposalsNew91.xlsx | tbProposalsNew91.xlsx |

- projects
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Data/2.2 Projects inventory/data/json/tbINVENTORY.json
    - **local path** .fs/import_files/project_database

- multi_year_projects
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Data/2.3 Progress reports/data/json/MultiYear-Projects.json
    - **local path** .fs/import_files/progress_report

- progress
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Data/2.3 Progress reports/data/csv/tbProgress.csv
    - **local path** .fs/import_files/progress_report

- countries 
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Data/2.3 Progress reports/data/json/tbCountryID.json
    - **local path** .fs/import_files/progress_report

- comments 
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Data/2.3 Progress reports/data/json/tbComment.json
    - **local path** .fs/import_files/progress_report

- meta_projects 
: download files from nextcloud
    - **nextcloud path** OzoneMlf/Data/2.4 PCR/data/json
    - **local path** .fs/import_files/pcr

    |nextcloud name | local name |
    | :----:    | :----:  |
    | hpmppcr2023/tbINVENTORY.json | hpmppcr2023/tbINVENTORY.json |
    | pcr2023/tbINVENTORY.json | pcr2023/tbINVENTORY.json |

- all_pcr
: download folders from nextcloud
    - **nextcloud path** OzoneMlf/Data/2.4 PCR/data/json
    - **local path** .fs/import_files/pcr

    |nextcloud name | local name |
    | :----:    | :----:  |
    | hpmppcr2023 | hpmppcr2023 |
    | pcr2023 | pcr2023 |

---

## Business Palns 
To import business plans
```shell
docker-compose exec app ./manage.py import_business_plans
```

### Import Files
: download all files from nextcloud except "Business Plan Template and Sample" file
  - **nextcloud path** OzoneMlf/Data/2.7 Business plans
  - **local path** .fs/import_files/business_plans



---

## Country programme format
To import country programme formats
```shell
docker-compose exec app ./manage.py import_cp_format
```

### Import Files
  - **nextcloud path** OzoneMlf/Data/1. Country Programme/CP Format/CP Format - 2022 and beyond(Final-92ndMtg)Consultant.xls
  - **local path** .fs/import_files/cp_format/CP_Format_2022.xls
