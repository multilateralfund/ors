"""
Cluster -> funding-theme map, keyed on ``ProjectCluster.code``.

Codes are stable identifiers; display names are not. Do not switch this to
``ProjectCluster.group`` - that field files Energy Efficiency, Disposal, HCFC
Individual and HFC Individual under ``Production``, and is blank or null on 12
of 34 clusters. Use ``ProjectCluster.production`` for the production test.
"""

# Bar order on the funding-by-theme chart.
THEME_ORDER = (
    "HFCs consumption",
    "HCFCs consumption",
    "HCFCs production",
    "Other ODS consumption",
    "Other ODS production",
    "Energy efficiency",
    "Disposal",
    "Emission Control",
    "Institutional Strengthening",
)

THEME_STRUCTURE = [
    {"items": [{"label": "HFCs consumption", "color": "#012A3C"}]},
    {
        "items": [
            {"label": "HCFCs consumption", "color": "#0B4C66"},
            {"label": "HCFCs production", "color": "#0E6E8C"},
        ]
    },
    {
        "items": [
            {"label": "Other ODS consumption", "color": "#0095D5"},
            {"label": "Other ODS production", "color": "#2CA9DD"},
        ]
    },
    {"items": [{"label": "Energy efficiency", "color": "#57BEE4"}]},
    {"items": [{"label": "Disposal", "color": "#7ACBEA"}]},
    {"items": [{"label": "Emission control", "color": "#9AD8EF"}]},
    {"items": [{"label": "Institutional strengthening", "color": "#DEF1FA"}]},
]

THEME_BY_CLUSTER_CODE = {
    "CFCIND": "Other ODS consumption",
    "CPOP": "Other ODS consumption",
    "CPPOP": "Other ODS production",
    "DISP": "Disposal",
    "EC 1": "Emission Control",
    "EC 2": "Emission Control",
    "EC IND": "Emission Control",
    "EE": "Energy efficiency",
    "GOV": "Institutional Strengthening",
    "HCFCIND": "HCFCs consumption",
    "HPMP1": "HCFCs consumption",
    "HPMP2": "HCFCs consumption",
    "HPMP3": "HCFCs consumption",
    "HPMP4": "HCFCs consumption",
    "HPPMP1": "HCFCs production",
    "HPPMP2": "HCFCs production",
    "HPPMP3": "HCFCs production",
    "HFCIND": "HFCs consumption",
    "KIP1": "HFCs consumption",
    "KIP2": "HFCs consumption",
    "KIP3": "HFCs consumption",
    "OOI": "Other ODS consumption",
    "OOPPP": "Other ODS production",
    "OOSP": "Other ODS consumption",
}

# Clusters that deliberately have no theme. Their funding is reported as
# ``theme_unmapped`` rather than dropped.
KNOWN_UNMAPPED_CLUSTER_CODES = frozenset(
    {
        "AGC",  # Agency Programme
        "AFM",  # Alternative Financing Mechanism
        "KPP1",  # Kigali Implementation Plan Production Stage 1
        "KPP2",  # Kigali Implementation Plan Production Stage 2
        "KPP3",  # Kigali Implementation Plan Production Stage 3
        "ATMON",  # Atmospheric Monitoring
        "CP",  # Country Programme
        "EC",  # the bare Emission Control cluster; EC 1/2/IND are mapped
        "INS",
        "OTH",  # Other
    }
)
