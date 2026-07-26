from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Fixes out-of-order migration history for custom user model'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check if core.0001_initial is missing from django_migrations table
            cursor.execute("SELECT id FROM django_migrations WHERE app = 'core' AND name = '0001_initial';")
            row = cursor.fetchone()
            if not row:
                self.stdout.write("Inserting core.0001_initial into django_migrations...")
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES ('core', '0001_initial', NOW());"
                )
                self.stdout.write(self.style.SUCCESS("Successfully inserted core.0001_initial into django_migrations."))
            else:
                self.stdout.write("core.0001_initial already present in django_migrations.")
