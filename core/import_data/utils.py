def parse_string(str):
    """
    remove white spaces and convert to lower case
    """
    if not str:
        return None

    return str.strip().lower()
