import React, {ChangeEvent, useState} from 'react';

import Typography from '@mui/material/Typography';

import {SectionMeta} from "@ors/components/manage/Blocks/CountryProgramme";
import IconButton from "@ors/components/ui/IconButton/IconButton";


const FileInput: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const filesArray = Array.from(event.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const formatFileNames = () => {
    return selectedFiles.map(file => file.name).join('; ');
  };

  return (
    <div className="flex items-center w-full h-fit grow">
      <input
        id="file_attachments"
        className="hidden"
        type="file"
        accept="image/*, application/pdf, application/msword,
                application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation,
                .zip, .rar"
        onChange={handleFileChange}
        multiple
      />
      <div className="flex w-full bg-white rounded-l-lg border-2 border-gray-900 p-2">
        <Typography component="span" variant="body2">
          {selectedFiles.length === 0 ? 'No files selected' : formatFileNames()}
        </Typography>
      </div>
      <label htmlFor="file_attachments">
        <IconButton
          className="flex items-center justify-center text-nowrap rounded-r-lg"
          aria-label="upload image"
          component="span"
        >
          Browse files
          {/*<AiOutlineCloudUpload size={24}/>*/}
        </IconButton>
      </label>
    </div>
  );
};

const ReportInfoCreate = ({section}: { section: SectionMeta }) => {
  return (
    <section className="grid grid-cols-2 auto-rows-auto gap-4">
      <Typography
        className="col-span-2"
        component="h2"
        variant="h6"
      >
        {section.title}
      </Typography>
      <div className="bg-gray-100 rounded-lg p-4 flex flex-col gap-4">
        <h2>Summary</h2>
        <div>
          <label className="block mb-2 text-md font-normal text-gray-900" htmlFor="name">
            Name of reporting entity
          </label>
          <input id="name"
                 name="name"
                 className="bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                 type="text"/>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-md font-normal text-gray-900" htmlFor="country">
              Country
            </label>
            <input id="country"
                   name="country"
                   className="bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                   type="text"/>
          </div>
          <div>
            <label className="block mb-2 text-md font-normal text-gray-900" htmlFor="reporting_year">
              Reporting for year
            </label>
            <input id="reporting_year"
                   name="reporting_year"
                   className="bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                   type="text"/>
          </div>
        </div>

        <FileInput/>
        <p id="file_input_help" className="mt-1 text-xs text-gray-900">
          Allowed files extensions: .pdf, .doc, .docx, .xls, .xlsx, .csv, .ppt, .pptx, .jpg, .jpeg, .png, .gif, .zip,
          .rar, .7z
        </p>

      </div>
      <div></div>
    </section>
  )
}

export default ReportInfoCreate
