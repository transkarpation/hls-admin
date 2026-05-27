"use client";

import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  DateField,
  FunctionField,
} from "react-admin";

export function CronList() {
  return (
    <List>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <TextField source="expression" label="Schedule" />
        <FunctionField
          label="Action"
          render={(record: { command?: string; scriptFilename?: string }) =>
            record.scriptFilename
              ? `📄 ${record.scriptFilename}`
              : record.command || "—"
          }
        />
        <BooleanField source="enabled" />
        <DateField source="lastRunAt" label="Last Run" showTime />
        <DateField source="createdAt" label="Created" />
      </Datagrid>
    </List>
  );
}
