import React, {ChangeEvent, useState} from 'react';

import {TextField} from "@mui/material";
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
    <TextField
      type="text"
      value={selectedFiles.length === 0 ? 'No files selected' : formatFileNames()}
      variant="standard"
      InputProps={{
        className: "flex bg-white rounded-lg border border-solid border-gray-400 pl-2 h-11",
        disableUnderline: true,
        endAdornment: (
          <IconButton
            className="flex items-center justify-center text-nowrap text-lg font-normal rounded-l-none h-full border-y-0 border-r-0 border-gray-400"
            aria-label="upload files"
            component="label"
          >
            <input
              id="file_attachments"
              name="file_attachments"
              type="file"
              accept="image/*, application/pdf, application/msword,
                application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation,
                .zip, .rar"
              onChange={handleFileChange}
              hidden
              multiple
              // onChange={handleUpload}
            />
            Browse files
          </IconButton>
        ),
        readOnly: true,
      }}
      fullWidth
    />
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
                 className="h-11 bg-white shadow-none border border-solid border-gray-400 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                 autoComplete="off"
                 type="text"/>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-md font-normal text-gray-900" htmlFor="country">
              Country
            </label>
            <input id="country"
                   name="country"
                   className="h-11 bg-white shadow-none border border-solid border-gray-400 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                   autoComplete="off"
                   type="text"/>
          </div>
          <div>
            <label className="block mb-2 text-md font-normal text-gray-900" htmlFor="reporting_year">
              Reporting for year
            </label>
            <input id="reporting_year"
                   name="reporting_year"
                   className="h-11 bg-white shadow-none border border-solid border-gray-400 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                   autoComplete="off"
                   type="text"/>
          </div>
        </div>

        <FileInput/>
        <p id="file_input_help" className="mt-1 text-sm text-pretty text-gray-900">
          Allowed files extensions: .pdf, .doc, .docx, .xls, .xlsx, .csv, .ppt, .pptx, .jpg, .jpeg, .png, .gif, .zip,
          .rar, .7z
        </p>

      </div>
      <div></div>
    </section>
  )
}

export default ReportInfoCreate
