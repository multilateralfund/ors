# MultilateralFund Backend Development

1. Install Docker and Docker Compose.
   <https://docs.docker.com/get-docker/>
   <https://docs.docker.com/compose/install/>

2. Copy override example and adjust as necessary:

   ```shell
   cp docker-compose.develop.yml docker-compose.override.yml
   ```

3. Copy and customize the example `.env` file with configuration variables

   ```shell
   cp .env.example .env
   ```

4. Build Docker images and start the containers:

   ```shell
   docker-compose build
   docker-compose up -d
   ```

5. Run migrations and create initial admin user:

   ```shell
   docker-compose exec app ./manage.py migrate
   docker-compose exec app ./manage.py createsuperuser
   ```

6. Open the site in a browser: http://localhost:8080/api

7. The admin panel: http://localhost:8080/admin/
   Login in the admin panel using the superuser account created at step 5

### Updating the development environment

When pulling new code, you may have to:

- Rebuild the Docker images
- Run migrations

```shell
docker-compose build
docker-compose up -d
```

### View logs in real time

In order to view the logs in real time, run the command `docker-compose logs -f <service>`:

```shell
docker-compose logs -f <service>
```

### Recreating the local database

It may become necessary to return the development environment to a fresh state. That involves recreating the database:

```shell
docker-compose down
docker volume rm multilateralfund_db
docker-compose up -d
docker-compose exec app ./manage.py createsuperuser
```

### Update models.py

Every time that the models inside the `models.py` are changed these two commands need to be executed:

```shell
docker-compose exec app ./manage.py makemigrations
```

### Run Tests

```shell
docker-compose exec app pytest
```
