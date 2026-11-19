import React from "react";
import LayoutForm from "./LayoutForm";

// UPDATE view for BOTH layout types ("email" and "letter").
const UpdateLayout = ({ layoutType, layout, onClose }) => (
  <LayoutForm
    mode="update"
    layoutType={layoutType}
    layout={layout}
    onClose={onClose}
  />
);

export default UpdateLayout;
