# Development guide

## Style guide

- The frontend code uses ES lint and prettier. This can be integrated into your IDE or manually run with:
  ```bash
  cd frontend && npm run lint
  ```

A workflow is integrated into GitHub action to check that any code push has been first processed with the project
settings. See [code style workflow](https://github.com/digital-agenda-data/digital-agenda/actions/workflows/lint.yml)

## Starting points

- Backend:
  - [django](https://docs.djangoproject.com/)
  - [django-rest-framework](https://www.django-rest-framework.org/)
- Frontend:
  - [react](https://react.dev/)
  - [react-router](https://reactrouter.com/en/main)
  - [vite](https://vitejs.dev/)
- API documentation can be found at [here](http://localhost:8080/api/docs/) while running locally or [here](https://multilateralfund.edw.ro/api/docs/) for staging environment. You can also find a link to it in admin page, in the top right corner, next to your username.

## Adding a new backend dependency

To add a new dependency:

- Add it to [requirements.txt](/requirements.txt)
- Create a new virtualenv and activate it
  ```bash
  virtualenv .venv && source .venv/bin/activate
  ```
- Install all dependencies
  ```bash
  pip install -r requirements.txt
  ```
- Freeze the new constraints
  ```
  pip freeze > requirements.txt
  ```

## Previewing production build locally

Checking certain aspects of the app (like bundle chunking and sizes) requires previewing
a production build. To do so follow these steps:

- Create an env config file in the frontend dir to point the API host at the local
  backend server:
  ```shell
  $ cat frontend/.env.local
  VITE_APP_API_HOST=localhost:8000
  ```
- Build frontend for prod
  ```shell
  cd frontend/
  npm run build
  ```
- A file will be generated with some bundle stats, that can be checked if needed:
  ```shell
  bundle.stats.html
  ```
- Use the preview script to serve the bundle locally:
  ```shell
  npm run preview
  ```
