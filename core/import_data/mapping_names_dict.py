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
    "Commonwealth of Dominica": "Dominica",
    "Lao, DPR": "Lao People's Democratic Republic",
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
        "sector_code": None,
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
        "sector_code": "TAS",  # deleted sectorctor => set sector = None
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
    "TRA": "TAS",
}

BP_SECTOR_SUBSECTOR_MAPPING = {
    "DESTRUCTION": {
        "sector": "DES",
        "subsector": None,
    },
    "FOA - Rigid PU foam": {
        "sector": "FOA",
        "subsector": "Rigid PU",
    },
    "FOA-Rigid PU foam": {
        "sector": "FOA",
        "subsector": "Rigid PU",
    },
    "Fumigation": {
        "sector": "FUM",
        "subsector": None,
    },
    "REF - AC": {
        "sector": "REF",
        "subsector": "Air conditioning",
    },
    "REF - (Commercial ref)": {
        "sector": "REF",
        "subsector": "Commercial Refrigeration",
    },
    "REF - Commercial ref": {
        "sector": "REF",
        "subsector": "Commercial Refrigeration",
    },
    "REF-Commerical refrigeration": {
        "sector": "REF",
        "subsector": "Commercial Refrigeration",
    },
    "REF - Industrial ref": {
        "sector": "REF",
        "subsector": "Industrial refrigeration",
    },
    "Ref-Servicing": {
        "sector": "REF",
        "subsector": "Servicing",
    },
}

USAGE_NAME_MAPPING = {
    "Aerosal": "Aerosol",
    "FireFighting": "Fire fighting",
    "ProcessAgent": "Process agent",
    "LabUse": "Lab use",
    "NoneQPS": "Non-QPS",
    "TobaccoFluffing": "Tobacco fluffing",
    "refrigeration air conditioning": "Refrigeration Manufacturing AC",
    "air conditioning": "Refrigeration Manufacturing AC",
    "solvent": "Solvent application",
    "manufacturing": "Refrigeration Manufacturing",
    "processing agent": "Process agent",
}

CHEMICAL_NAME_MAPPING = {
    "R-125 (65.1%), R-134a  -  (31.5%)": "R-422D",
    "hcfrc-141b": "HCFC-141B",
    "HFC-365mfc (93%)/HFC-227ea (7%) - mezcla": "CustMix-134",
    "Solkane 365/227 (Mezcla HFC)": "CustMix-134",
    "(HFC-365mfc=93%, HFC-227ea=7%)": "CustMix-134",
    "HFC-365mfc/HFC-227ea in imported pre-blended polyol": "CustMix-134 in imported pre-blended polyol",
    "HFC-365/227 in imported pre-blended polyol": "CustMix-134 in imported pre-blended polyol",
    "HFC-365/227 (93/7)": "CustMix-134",
    "HFC-356mfc": "HFC-365mfc",
    "HFOs1234": "HFO-1234yf",
    "NH3": "R-717 (ammonia (NH3))",
    "Ammoniac (R717)": "R-717 (ammonia (NH3))",
    "Ammoniac (R-717)": "R-717 (ammonia (NH3))",
    "Ammoniac (R718)": "R-717 (ammonia (NH3))",
    "R-717": "R-717 (ammonia (NH3))",
    "HFC-417A": "R-417A",
    "R-1234yf": "HFO-1234yf",
    "R-406A (containing R-22)": "R-406A",
    "R-507": "R-507A",
    "R-32": "HFC-32",
    "R-152a": "HFC-152a",
    "R-1233zd": "HFO-1233zd",
    "HFO-1234zd (E)": "HFO-1234ze(E)",
    "HFO-1336mzz (e)": "HFO-1336mzz(E)",
    "HFO1234yf": "HFO-1234yf",
    "R-1234YF": "HFO-1234yf",
    "R-1233ZE": "HFO-1234ze(E)",
    "R-1234ze": "HFO-1234ze(E)",
    "HFO-1234 ze(E)": "HFO-1234ze(E)",
    "PFC 1102 HC (HFC-125 =24%, HFC-236fa=26%,R-14=21%,R-740=10%,HFC-23=19%)": "CustMix-281",
    "R-744": "R-744 (carbon dioxide)",
    "HFC-227ea en polioles premezclados imp.": "HFC-227ea in imported pre-blended polyol",
    "Chesterton 296 (HFC-134a=45%, HFC-365mfc=25%, HFC-245fa=25%, isopropanol)": "CustMix-262",
    "CHESTERTON 296 (HFC-134a=45%, HFC-365mfc=25%, HFC-245fa=25%, isopropanol)": "CustMix-262",
    "CHESTERTON 296": "CustMix-262",
    "R125//R134a/other uncontrolled substances(50.5%/47%/2.5%)": "R-424A",
    "R32/R125/R134a/other uncontrolled substances(26%/26%/21%/27%)": "CustMix-291",
    "LPS QB Duster (HFC-134a=90-100%)": "HFC-134a",
    "LPS QB Duster": "HFC-134a",
    "CHESTERTON 279 (HFC-134a=25-35% )": "CustMix-334",
    "CHESTERTON 279": "CustMix-334",
    "F-222": "CFC-11",
    "R32/ R125/ R134a/ R601a/R600) (8.5%/45%/44.2%/0.6%/1.7%)": "R-438A",
    "Opteon SF79 (HFC-43-10mee=1%; HCO-1130(E)=95%;Methoxytridecafluoroheptene=4%)": "CustMix-166",
    "Vertrel MCA (HFC-43-10mee=62%; HCO-1130(E)=38%)": "CustMix-174",
    "Vertrel MCA": "CustMix-174",
    "R502": "R-502",
    "OTHER (R502)": "R-502",
    "PFC 672FC (HFC-125=15%, HFC-236fa=10%)": "CustMix-324",
    "MDI (for production of foam)": "Methylene diphenyl diisocyanate (MDI)",
    "MDI": "Methylene diphenyl diisocyanate (MDI)",
    "Other3": "Other",
    "Others": "Other",
    "OTHER (R502 and HCFC-115 blend)": "Other",
    "HFO en poliol formulado": "HFO in imported pre-blended polyol",
    "Whacool 38A": "CustMix-317",
    "R23/R125/R245fa/R236fa/other uncontrolled": "CustMix-327",
    "R32/R125/R134a/R227ea/R236fa/other uncontrolled": "CustMix-332",
    "R32/R125/R134a/other uncontrolled substances(26%/21%/20%/33%)": "CustMix-331",
    "R32/R125/R134a/other uncontrolled": "CustMix-331",
    "Cyclopentane in Imported Pre-blended Polyol": "Cyclopentane",
    "HFO-1336zd": "HFO-1336mzz(Z)",
    "R-417": "R-417B",
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

CP_FORMAT_FILE_DATA_MAPPING = {
    "CP_Format_2005_2011.xls": {
        "sheets": {
            "Data Sheet": "A",
            "Adm-C": "C",
        },
        "time_frame": {"min_year": 1995, "max_year": 2011},
    },
    "CP_Format_2012_2018.xls": {
        "sheets": {
            "Data Sheet": "A",
            "Adm-C": "C",
        },
        "time_frame": {"min_year": 2012, "max_year": 2018},
    },
    "CP_Format_2019_2021.xls": {
        "sheets": {
            "Section A": "A",
            "Section B": "B",
            "Section C": "C",
        },
        "time_frame": {
            "min_year": 2019,
            "max_year": 2022,
        },  # 2019-2021 is actually 2019-2022
    },
    "CP_Format_2022.xls": {
        "sheets": {
            "Section A": "A",
            "Section B": "B",
            "Section C": "C",
        },
        "time_frame": {
            "min_year": 2023,
            "max_year": None,
        },  # 2022 and beyond is actually 2023
    },
}

ADM_DE_MAPPING = {
    "N/A RMP already completed": "N/A RMP/NPP/TPMP already completed"
}
