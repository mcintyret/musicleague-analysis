import { Home } from "./ui/home";
import * as React from "react";
import * as ReactDOM from "react-dom";

const appElement = document.getElementById("app");

if (appElement != null) {
    ReactDOM.render((<Home/>), appElement);
}
