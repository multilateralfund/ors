from core.models.project_metadata import ProjectSpecificFields
from rest_framework import generics, mixins, status
from rest_framework.response import Response


class ProjectClusterTypeSectorAssociationView(
    mixins.ListModelMixin, generics.GenericAPIView
):
    """
    List project cluster type sector association
    """

    queryset = ProjectSpecificFields.objects.all()

    def get_queryset(self):
        return ProjectSpecificFields.objects.select_related("cluster", "type", "sector")

    def get(self, request, *args, **kwargs):
        """
        Handle GET requests to list project cluster type sector associations.
        """
        queryset = self.get_queryset()
        result = []
        clusters_dict = {}

        for entry in queryset:
            cluster_id = entry.cluster.id
            type_id = entry.type.id
            sector_id = entry.sector.id

            # Add cluster if not already present
            if cluster_id not in clusters_dict:
                cluster_obj = {
                    "cluster_id": cluster_id,
                    "cluster_name": entry.cluster.name,
                    "types": [],
                }
                clusters_dict[cluster_id] = cluster_obj
                result.append(cluster_obj)

            # Find or add type under this cluster
            types_list = clusters_dict[cluster_id]["types"]
            type_obj = next((t for t in types_list if t["type_id"] == type_id), None)
            if not type_obj:
                type_obj = {
                    "type_id": type_id,
                    "type_name": entry.type.name,
                    "sectors": [],
                }
                types_list.append(type_obj)

            # Add sector if not already present
            if not any(s["sector_id"] == sector_id for s in type_obj["sectors"]):
                type_obj["sectors"].append(
                    {"sector_id": sector_id, "sector_name": entry.sector.name}
                )

        return Response(result, status=status.HTTP_200_OK)
