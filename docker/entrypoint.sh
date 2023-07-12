#!/bin/bash
set -e
RUN_COMMAND="run"

wait_for_services.sh

if [ "$DJANGO_MIGRATE" = "yes" ]; then
  python manage.py migrate --noinput
fi

python manage.py collectstatic --noinput

GOPTS=""
if [ "$2" == "dev" ]; then
  GOPTS="--reload"
fi


if [[ "$RUN_COMMAND" == *"$1"* ]]; then
  gunicorn multilateralfund.wsgi --bind 0.0.0.0:8000 $GOPTS
fi

exec "$@"
