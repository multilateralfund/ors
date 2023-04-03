import csv
import os
import sys


from django.db import transaction
from models import Substance

@transaction.atomic
def insert_data_from_csv(file_path):
    with open(file_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        instances = []
        for row in reader:
            instance = Substance()
            instance.substance_name = row[0]
            instance.substance_formula = row[1]
            instance.substance_isomers = row[2]
            instance.substance_odp = row[3]
            instance.substance_gwp = row[4]
            instances.append(instance)
        Substance.objects.bulk_create(instances)

insert_data_from_csv('subst.csv')