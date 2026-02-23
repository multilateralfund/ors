import json
import pandas as pd


def generate_new_cluster_type_sector_file(file_path):
    """
    Generate new cluster type sector file based on the current data in the database

    @param file_path = str (file path for import file)
    """
    combinations = {}  # {cluster: {type: [sectors]}}
    df = pd.read_excel(file_path).fillna("")

    for _, row in df.iterrows():
        if row["Project type name"].strip() == "Project preparation":
            row["Project type name"] = "Preparation"

        if row["Sector name"].strip() == "Other Sector":
            continue

        combinations.setdefault(row["Cluster name"].strip(), {})
        combinations[row["Cluster name"].strip()].setdefault(
            row["Project type name"].strip(), []
        )
        combinations[row["Cluster name"].strip()][
            row["Project type name"].strip()
        ].append(row["Sector name"].strip())

    new_data = []
    for cluster_name, types in combinations.items():
        new_data.append(
            {
                "cluster": cluster_name,
                "types": [
                    {
                        "type": type_name,
                        "sectors": sorted(list(set(sector_names))),  # remove duplicates
                    }
                    for type_name, sector_names in types.items()
                ],
            }
        )

    with open("new_ClusterTypeSectorLinks.json", "w", encoding="utf8") as f:
        json.dump(new_data, f, indent=4)
