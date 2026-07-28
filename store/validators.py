from django.core.exceptions import ValidationError


def validate_file_size(file):
    max_size_kb = 1024  # 1MB
    max_size_bytes = max_size_kb * 1024

    if file.size > max_size_bytes:
        raise ValidationError(f'File too large. Maximum size is {max_size_kb}KB.')

    