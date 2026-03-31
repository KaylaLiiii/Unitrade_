import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "../utils";

// Chat is now embedded inside MyMessages.
// This page just redirects to MyMessages with the conversationId param.
export default function Chat() {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  return <Navigate to={createPageUrl("MyMessages") + (conversationId ? `?conversationId=${conversationId}` : "")} replace />;
}