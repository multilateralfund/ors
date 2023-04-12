# Installing for development

**WARNING! DO NOT USE THIS DEPLOYMENT IN A PRODUCTION ENVIRONMENT!**

This document describes installation steps required to install locally for development.

## Preparing environment

- Install nodejs (>=18)
- Install python and python-dev (>=3.11)
- Install and start postgresql (>=15)
- Create a postgresql database and user:
  ```shell
  sudo -u postgres createuser -Pds da && sudo -u postgres createdb da
  ```
- _(Recommended)_ create and activate a python virtualenv
- Clone this repository

## Installing Backend for development

- Configure local settings, starting from the dev example
  ```shell
  cp .env.develop.example .env
  ```
- Install dependencies
  ```shell
  pip install -c constraints.txt
  ```
- Run migrations
  ```shell
  ./manage.py migrate
  ```

## Installing Frontend for development

- Change directory to the frontend directory
  ```shell
  cd frontend
  ```
- Install dependencies
  ```shell
  npm install
  ```

## Running the application

- Start the backend with hot-reload
  ```shell
  ./manage.py runserver
  ```
- Start the frontend with hot-reload (from frontend directory)

  ```shell
  cd /frontend
  npm run dev
  ```

- Check frontend is running correctly at http://localhost:8080
- Check backend is running correctly at http://localhost:8000/api/admin and login with credentials:

## Updating the application

- Update the code with the latest version
- Update third-party packages required at runtime.
  ```shell
  pip install -c constraints.txt
  ```
- Update frontend dependencies
  ```shell
  cd frontend && npm install
  ```
- Run migrations:
  ```shell
  ./manage.py migrate
  ```

## Where to go from here?

the [development guide](./development_guide.md) to help you get started.
