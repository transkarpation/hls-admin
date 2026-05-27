"use client";

import {
  Create,
  SimpleForm,
  TextInput,
  BooleanInput,
  FileInput,
  FileField,
  required,
} from "react-admin";

export function CronCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={required()} />
        <TextInput
          source="expression"
          label="Cron Expression"
          validate={required()}
          helperText="e.g. */5 * * * * (every 5 minutes)"
        />
        <TextInput
          source="command"
          helperText="Shell command to execute (optional if script is provided)"
        />
        <FileInput
          source="script"
          accept={{ "application/javascript": [".js", ".mjs"] }}
          helperText="Upload a JS script to run (optional if command is provided)"
        >
          <FileField source="src" title="title" />
        </FileInput>
        <BooleanInput source="enabled" defaultValue={true} />
      </SimpleForm>
    </Create>
  );
}
