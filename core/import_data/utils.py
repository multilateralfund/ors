from core.models.substance import Substance, SubstanceAltName


def parse_string(str):
    """
    remove white spaces and convert to lower case
    """
    if not str:
        return None

    return str.strip().lower()


def get_substance_id_by_name(substance_name):
    """
    get substance id by name or alt name (case insensitive)
    @param substance_name: string subsance name

    @return: int substance id
    """
    substance = Substance.objects.get_by_name(substance_name).first()
    if substance:
        return substance.id

    substance = SubstanceAltName.objects.get_by_name(substance_name).first()
    if substance:
        return substance.substance_id

    return None
