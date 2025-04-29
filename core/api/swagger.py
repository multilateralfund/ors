from drf_yasg.inspectors import SwaggerAutoSchema


class FileUploadAutoSchema(SwaggerAutoSchema):
    def get_consumes(self):
        return ["multipart/form-data"]
