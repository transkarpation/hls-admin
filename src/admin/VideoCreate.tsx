"use client";

import {
  Create,
  SimpleForm,
  TextInput,
  FileInput,
  FileField,
  required,
} from "react-admin";

export function VideoCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="title" validate={required()} />
        <TextInput source="description" multiline rows={3} />
        <FileInput
          source="file"
          accept={{ "video/*": [] }}
          validate={required()}
        >
          <FileField source="src" title="title" />
        </FileInput>
      </SimpleForm>
    </Create>
  );
}
