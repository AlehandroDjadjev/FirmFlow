# Generated by Django 5.1.7 on 2025-03-21 13:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('llm_api', '0003_remove_document_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='firm',
            name='name',
            field=models.CharField(max_length=255),
        ),
    ]
