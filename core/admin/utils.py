def get_final_display_list(cls, exclude):
    exclude.append("id")
    return [field.name for field in cls._meta.get_fields() if field.name not in exclude]
