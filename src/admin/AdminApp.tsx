"use client";

import { Admin, Resource } from "react-admin";
import { BrowserRouter } from "react-router-dom";
import { UserList } from "./UserList";
import { UserCreate } from "./UserCreate";
import { VideoList } from "./VideoList";
import { VideoCreate } from "./VideoCreate";
import { Dashboard } from "./Dashboard";
import { dataProvider } from "./dataProvider";

export function AdminApp() {
  return (
    <BrowserRouter basename="/dashboard">
      <Admin dataProvider={dataProvider} dashboard={Dashboard}>
        <Resource name="users" list={UserList} create={UserCreate} />
        <Resource name="videos" list={VideoList} create={VideoCreate} />
      </Admin>
    </BrowserRouter>
  );
}
