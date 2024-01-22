COUNTRY_NAME_MAPPING = {
    "Brunei Darussalan": "Brunei Darussalam",
    "Cap Verde": "Cabo Verde",
    "Czech Republic": "Czechia",
    "Eswatini (the Kingdom of)": "Eswatini",
    "Federated States of Micronesia": "Micronesia (Federated States of)",
    "Lao, PDR": "Lao PDR",
    "SAO TOME ET PRINCIPE": "Sao Tome and Principe",
    "Turkiye": "Turkey",
    "Tuerkiye": "Turkey",
    "USA": "United States of America",
    "Western Samoa": "Samoa",
    "Moldova, Rep": "Moldova",
    "Micronesia": "Micronesia (Federated States of)",
    "Macedonia": "The Former Yugoslav Republic of Macedonia",
    "United Arab Emirats": "United Arab Emirates",
    "Timor Leste": "Timor-Leste",
    "Guinea-Bissau": "Guinea Bissau",
    "Colmbia": "Colombia",
    "Islamic Republic of Iran": "Iran",
    "St. Kitts and Nevis": "Saint Kitts and Nevis",
    "St. Lucia": "Saint Lucia",
    "St. Vincent and the Grenadines": "Saint Vincent and the Grenadines",
}

SECTOR_NAME_MAPPING = {
    "Fire fighting": "Firefighting",
    "Destruction": "Disposal",
    "Halon": "Firefighting",
}
SECTOR_CODE_MAPPING = {
    "HAL": "FFI",
}

SUBSECTOR_SECTOR_MAPPING = {
    # subsector_name = None => Subsector deleted
    # sector_code = None => Keep the original sector
    "Contract filler": {
        "subsector_name": "Other Aeresols",
        "sector_code": "ARS",
    },
    "Filling plant": {
        "subsector_name": None,
        "sector_code": "ARS",
    },
    "Demonstration": {
        "subsector_name": None,
        "sector_code": "DES",
    },
    "Information exchange": {
        "subsector_name": "Information Exchange",
        "sector_code": "PCAP",
    },
    "Sectoral phase out plan": {
        "subsector_name": "Phase out Plan",
        "sector_code": None,
    },
    "Technical assistance/support": {
        "subsector_name": None,
        "sector_code": None,
    },
    "Training programme/workshop": {
        "subsector_name": None,
        "sector_code": "FFI",
    },
    "Extinguisher": {
        "subsector_name": "Assembly Fire Protections Systems",
        "sector_code": None,
    },
    "Extinguisher/fixed system": {
        "subsector_name": "Assembly Fire Protections Systems",
        "sector_code": None,
    },
    "Banking": {
        "subsector_name": "Banking",
        "sector_code": None,
    },
    "Rigid PU (insulation domestic refrigeration)": {
        "subsector_name": "Rigid PU",
        "sector_code": None,
    },
    "Rigid PU (insulation commercial refrigeration)": {
        "subsector_name": "Rigid PU",
        "sector_code": None,
    },
    "Rigid PU panels": {
        "subsector_name": "Rigid PU",
        "sector_code": None,
    },
    "Flexible PU": {
        "subsector_name": None,
        "sector_code": "FOA",
    },
    "Several PU foam": {
        "subsector_name": None,
        "sector_code": "FOA",
    },
    "Polyol production": {
        "subsector_name": None,
        "sector_code": "FOA",
    },
    "HFC phase-down plan": {
        "subsector_name": "HFC phase down plan",
        "sector_code": "",
    },
    "Agency programme": {
        "subsector_name": None,
        "sector_code": "TAS",
    },
    "Ozone unit support": {
        "subsector_name": None,
        "sector_code": "SEV",
    },
    "Process conversion": {
        "subsector_name": None,
        "sector_code": "PAG",
    },
    "Project monitoring and coordination unit (PMU)": {
        "subsector_name": None,
        "sector_code": "PMU",
    },
    "HCFC closure": {
        "subsector_name": "Production Plant Closure",
        "sector_code": None,
    },
    "Domestic refrigeration (refrigerant)": {
        "subsector_name": "Domesitic Refrigeration",
        "sector_code": None,
    },
    "Commercial refrigeration (refrigerant)": {
        "subsector_name": "Commercial Refrigeration",
        "sector_code": None,
    },
    "Domestic/commercial refrigeration (refrigerant)": {
        "subsector_name": None,
        "sector_code": "REF",
    },
    "MAC": {
        "subsector_name": "MAC",
        "sector_code": "AC",
    },
    "MAC Compressor": {
        "subsector_name": "Compressor",
        "sector_code": "AC",
    },
    "Multiple-subsectors": {
        "subsector_name": None,
        "sector_code": None,
    },
    "Multiple solvents": {
        "subsector_name": "Solvents",
        "sector_code": "SOL",
    },
    "MAC recovery/recycling": {
        "subsector_name": "Servicing",
        "sector_code": "",
    },
    "Recovery/recycling": {
        "subsector_name": "Servicing",
        "sector_code": "",
    },
    "Refrigerant management plan": {
        "subsector_name": "Servicing",
        "sector_code": "",
    },
    "Refrigeration servicing sector": {
        "subsector_name": "Servicing",
        "sector_code": "",
    },
    "Sterilization services": {
        "subsector_name": "Sterilant",
        "sector_code": "",
    },
    "Network": {
        "subsector_name": "Network",
        "sector_code": "PCAP",
    },
    "Document/video/diskette": {
        "subsector_name": None,
        "sector_code": "PCAP",
    },
}

PROJECT_TYPE_CODE_MAPPING = {
    "CPG": "TAS",
    "INS": "TAS",
    "TRA": "TAS",
}

USAGE_NAME_MAPPING = {
    "Aerosal": "Aerosol",
    "FireFighting": "Fire fighting",
    "ProcessAgent": "Process agent",
    "LabUse": "Lab use",
    "NoneQPS": "Non-QPS",
    "TobaccoFluffing": "Tobacco fluffing",
}

CHEMICAL_NAME_MAPPING = {
    "R-125 (65.1%), R-134a  -  (31.5%)": "R-422D",
    "HFC-365mfc (93%)/HFC-227ea (7%) - mezcla": "CustMix-134",
}

DB_YEAR_MAPPING = {
    "CP": {
        "min_year": 2000,
        "max_year": 2011,
    },
    "CP2012": {
        "min_year": 2012,
        "max_year": 2018,
    },
}
