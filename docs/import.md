### Import data
To import groups, substances, blends and blend components please run:
```shell
docker-compose exec app ./manage.py import_ozone_data
```

To import countries run:
```shell
docker-compose exec app ./manage.py import_countries
```

To import usages run:
```shell
docker-compose exec app ./manage.py import_usages
```