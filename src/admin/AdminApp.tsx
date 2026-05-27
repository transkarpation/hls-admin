"use client";

import { Admin, Resource } from "react-admin";
import { BrowserRouter } from "react-router-dom";
import { UserList } from "./UserList";
import { UserCreate } from "./UserCreate";
import { VideoList } from "./VideoList";
import { VideoCreate } from "./VideoCreate";
import { CronList } from "./CronList";
import { CronCreate } from "./CronCreate";
import { Dashboard } from "./Dashboard";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { WebSocketProvider } from "./WebSocketProvider";

export function AdminApp() {
  return (
    <BrowserRouter basename="/dashboard">
      <WebSocketProvider>
        <Admin dataProvider={dataProvider} authProvider={authProvider} dashboard={Dashboard}>
          <Resource name="users" list={UserList} create={UserCreate} />
          <Resource name="videos" list={VideoList} create={VideoCreate} />
          <Resource name="crons" list={CronList} create={CronCreate} />
        </Admin>
      </WebSocketProvider>
    </BrowserRouter>
  );
}
