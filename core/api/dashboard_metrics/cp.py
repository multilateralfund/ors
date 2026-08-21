"""
Country-programme consumption and production trends.

A reshaping adapter, not a computation. ``CPDataExtractionAllExport``
(``core/api/views/cp_records_export.py``) instantiates with no arguments and
already does the work, unit conversions included:

- ``_get_cp_consumption_data`` - section A per (country, group), in ODP
- ``_get_hfc_consumption_data`` - annex F, converted to CO2-eq via GWP
- ``get_existent_reports`` - which (country, year) pairs actually reported,
  which is what separates a genuine zero from a missing report
- ``get_consumption_set`` / ``get_mbr_consumption_data`` - the consumption
  rules and the methyl bromide QPS split

Call it once for the whole portfolio and index by country; it computes
everything at once, so calling it per country is pathological. This module
reshapes ``record_value_<year>`` keys into ``[[year, value], ...]``, drops the
pre-seeded zero rows, and keeps genuine zero years - a country reaching zero is
the result worth showing.

Records arrive via ``get_final_records_for_years``
(``core/api/views/utils.py``). ``ods_production`` has no equivalent upstream
and is written here, returning ``None`` when every year is zero.
"""
