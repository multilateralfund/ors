"""
Theme, substance-family and sector bucketing, and the agency roll-up.

Planned:

- ``project_theme(project)`` - first match wins: Production, Energy efficiency,
  Disposal, HFC-23, Institutional strengthening, then Consumption as the
  residual. Take the production test from ``ProjectCluster.production``.
- ``substance_family(project)`` - prefer ``ProjectOdsOdp.ods_substance.group``
  (``C``/``I`` HCFC, ``F`` HFC) over ``Project.substance_type``, which is
  deprecated and ~23% null; fall back to cluster membership.
- ``sector_bucket(project)`` - keyed on ``ProjectSector.code``, never on the
  display name. Unmapped sectors are dropped and reported, not absorbed.
- ``agency_rollup(rows)`` - UNDP, UNEP, UNIDO, World Bank and WMO each get a
  row; everything else sums into "Bilateral Agencies". Match on a name set via
  ``AgencyManager.find_by_name`` and tolerate a missing WMO; ``agency_type`` is
  unreliable.
"""
