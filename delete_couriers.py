import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.db import connection

names = ['Mehdi T.', 'Soukaina B.', 'Hamza R.', 'Yacine A.']
with connection.cursor() as cursor:
    cursor.execute(
        'DELETE FROM orders_courierlocation WHERE courier_id IN (SELECT id FROM orders_courierprofile WHERE display_name IN (%s,%s,%s,%s))',
        names
    )
    cursor.execute(
        'DELETE FROM orders_courierprofile WHERE display_name IN (%s,%s,%s,%s)',
        names
    )
print('Suppression OK')
