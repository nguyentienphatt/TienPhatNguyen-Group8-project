import React from "react";
import UsersProvider from "./context/UsersContext";
import UserList from "./components/UserList";

export default function App() {
  return (
    <UsersProvider>
      <UserList />
    </UsersProvider>
  );
}
