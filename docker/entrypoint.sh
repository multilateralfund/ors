#!/bin/bash

set -e
RUN_COMMAND="run"

wait_for_services.sh

if [ "$DJANGO_MIGRATE" = "yes" ]; then
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
fi

if [[ "$RUN_COMMAND" == *"$1"* ]]; then
    gunicorn multilateralfund.wsgi --bind 0.0.0.0:8000
fi

exec "$@"