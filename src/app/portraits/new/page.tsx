import { redirect } from "next/navigation";

export default function PortraitsNewPage() {
  redirect("/portraits/upload");
}