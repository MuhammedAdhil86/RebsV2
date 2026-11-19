import React from "react";
import LayoutForm from "./LayoutForm";

// CREATE view for BOTH layout types ("email" and "letter").
const CreateLayout = ({ layoutType, onClose }) => (
  <LayoutForm mode="create" layoutType={layoutType} onClose={onClose} />
);

export default CreateLayout;
