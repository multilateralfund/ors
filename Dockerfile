FROM python:3.11-slim

ARG REQFILE=requirements.txt
ENV APP_HOME=/var/local/multilateralfund

WORKDIR $APP_HOME

RUN runDeps="netcat gettext build-essential gcc" \
    && apt-get update -y \
    && apt-get install -y --no-install-recommends $runDeps \
    && apt-get clean \
    && rm -vrf /var/lib/apt/lists/*

RUN pip install --upgrade pip
COPY $REQFILE .
RUN pip install --no-cache-dir -r $REQFILE

COPY . $APP_HOME

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["run"]