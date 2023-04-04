# PraisB Backend Development

1. Install Docker and Docker Compose.
   <https://docs.docker.com/get-docker/>
   <https://docs.docker.com/compose/install/>

2. Copy and customise the example `.env` file with configuration variables

   ```shell
   cp .env.example .env
   ```

3. Build Docker images and start the containers:

   ```shell
   docker-compose build
   docker-compose up -d
   ```
4. Run migrations and create initial admin user:

   ```shell
   docker-compose exec app wait-for db:5432 -- echo "Ready"
   docker-compose exec app ./manage.py migrate
   docker-compose exec app ./manage.py createsuperuser
   ```

5. Open the site in a browser: http://localhost:8000

6. The admin panel: http://localhost:8000/admin/
   Login in the admin panel using the superuser account created at step 4

### Updating the development environment

When pulling new code, you may have to:

- Rebuild the Docker images
- Run migrations

```shell
docker-compose build
docker-compose up -d
docker-compose exec app ./manage.py migrate
```

### View logs in real time

In order to view the logs in real time run the command `docker-compose logs -f <service>`:

```shell
docker-compose logs -f <service>
```

### Recreating the local database

It may become necessary to return the development environment to a fresh state. That involves recreating the database:

```shell
docker-compose down
docker volume rm multilateralfund_db
docker-compose up -d
docker-compose exec app wait-for db:5432 -- echo "Ready"
docker-compose exec app ./manage.py migrate
docker-compose exec app ./manage.py createsuperuser
```

### Update models.py

Every time that the models inside the `models.py` are changed these two commands need to be executed:

```shell
docker-compose exec app ./manage.py makemigrations
docker-compose exec app ./manage.py migrate
```

### Run Tests

```shell
docker-compose exec app pytest
```

### Debugging

To debug the Django app follow these steps:

1. Place a breakpoint anywhere in the code

`import pdb; pdb.set_trace()`
or
`breakpoint()`

2. Uncomment these lines in `docker-compose.override.yml`:

   ```yml
   app:
     [...]
     # stdin_open: true
     # tty: true
   ```

3. Restart containers with the new configuration:

   ```shell
   docker-compose up -d
   ```

4. Attach to the `app` container and interact with the Python console once the breakpoint is reached:

   ```shell
   docker attach praisb_app_1
   ```
