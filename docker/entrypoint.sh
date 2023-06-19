#!/bin/bash

set -e
RUN_COMMAND="run"

while netstat -tulpn | grep LISTEN | grep :5432; do
  echo "Waiting for PostgreSQL server at 5432 to accept connections on port 5432..."
  sleep 1s
done

if [ "$DJANGO_MIGRATE" = "yes" ]; then
    python manage.py migrate --noinput
fi

python manage.py collectstatic --noinput

if [[ "$RUN_COMMAND" == *"$1"* ]]; then
    gunicorn multilateralfund.wsgi --bind 0.0.0.0:8000
fi

exec "$@"
