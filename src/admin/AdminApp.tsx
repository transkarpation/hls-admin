"use client";

import { Admin, Resource, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import PeopleIcon from "@mui/icons-material/People";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import ScheduleIcon from "@mui/icons-material/Schedule";
import DeleteIcon from "@mui/icons-material/Delete";
import "react-toastify/dist/ReactToastify.css";
import { UserList } from "./UserList";
import { UserCreate } from "./UserCreate";
import { UserEdit } from "./UserEdit";
import { VideoList } from "./VideoList";
import { VideoCreate } from "./VideoCreate";
import { CronList } from "./CronList";
import { CronCreate } from "./CronCreate";
import { DeletedUserList } from "./DeletedUserList";
import { Dashboard } from "./Dashboard";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { WebSocketProvider } from "./WebSocketProvider";
import { WSEventHandler } from "./WSEventHandler";
import { EventsPage } from "./EventsPage";

export function AdminApp() {
  return (
    <BrowserRouter basename="/dashboard">
      <WebSocketProvider>
        <ToastContainer position="top-right" />
        <Admin dataProvider={dataProvider} authProvider={authProvider} dashboard={Dashboard}>
          <WSEventHandler />
          <Resource name="users" list={UserList} create={UserCreate} edit={UserEdit} icon={PeopleIcon} />
          <Resource name="videos" list={VideoList} create={VideoCreate} icon={VideoLibraryIcon} />
          <Resource name="crons" list={CronList} create={CronCreate} icon={ScheduleIcon} />
          <Resource name="deleted-users" options={{ label: "Deleted Users" }} list={DeletedUserList} icon={DeleteIcon} />
          <CustomRoutes>
            <Route path="/events" element={<EventsPage />} />
          </CustomRoutes>
        </Admin>
      </WebSocketProvider>
    </BrowserRouter>
  );
}
