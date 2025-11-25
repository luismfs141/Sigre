import { configureStore } from "@reduxjs/toolkit";
import AppReducer from "./AppReducer";

export default configureStore({
  reducer: {
    app: AppReducer,
  },
});

